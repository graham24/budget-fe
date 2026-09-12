<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  // px of travel (after resistance) needed to arm the refresh
  threshold: {
    type: Number,
    default: 70,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["refresh"]);

const pull = ref(0);
const refreshing = ref(false);
const host = ref(null);

let startY = 0;
// reactive: the template keys the settle animation off it
const tracking = ref(false);

// The gesture only belongs to us when the page is already scrolled to the
// very top; otherwise the browser owns the scroll.
function atTop() {
  return window.scrollY <= 0;
}

function onTouchStart(event) {
  if (props.disabled || refreshing.value || event.touches.length !== 1) return;
  if (!atTop()) return;
  startY = event.touches[0].clientY;
  tracking.value = true;
}

function onTouchMove(event) {
  if (!tracking.value) return;
  const delta = event.touches[0].clientY - startY;

  // Scrolling up, or the page moved off the top mid-gesture, hand it back.
  if (delta <= 0 || !atTop()) {
    tracking.value = false;
    pull.value = 0;
    return;
  }

  // Rubber-band: the pull gets progressively harder, and is capped, so it
  // never feels like the page has come loose.
  pull.value = Math.min(delta * 0.45, props.threshold * 1.6);

  // Non-passive listener, so this actually suppresses the native overscroll.
  if (event.cancelable) event.preventDefault();
}

async function onTouchEnd() {
  if (!tracking.value) return;
  tracking.value = false;

  if (pull.value < props.threshold) {
    pull.value = 0;
    return;
  }

  refreshing.value = true;
  pull.value = props.threshold;
  try {
    await new Promise((resolve) => emit("refresh", resolve));
  } finally {
    refreshing.value = false;
    pull.value = 0;
  }
}

onMounted(() => {
  const el = host.value;
  el.addEventListener("touchstart", onTouchStart, { passive: true });
  // must be non-passive to preventDefault the browser's own overscroll
  el.addEventListener("touchmove", onTouchMove, { passive: false });
  el.addEventListener("touchend", onTouchEnd, { passive: true });
  el.addEventListener("touchcancel", onTouchEnd, { passive: true });
});

onBeforeUnmount(() => {
  const el = host.value;
  if (!el) return;
  el.removeEventListener("touchstart", onTouchStart);
  el.removeEventListener("touchmove", onTouchMove);
  el.removeEventListener("touchend", onTouchEnd);
  el.removeEventListener("touchcancel", onTouchEnd);
});
</script>

<template>
  <div
    ref="host"
    class="ptr"
  >
    <div
      class="ptr__indicator"
      :style="{ height: `${pull}px`, opacity: pull > 6 || refreshing ? 1 : 0 }"
      aria-hidden="true"
    >
      <v-progress-circular
        v-if="refreshing"
        indeterminate
        color="primary"
        size="20"
        width="2"
      />
      <v-icon
        v-else
        icon="mdi-arrow-down"
        size="20"
        class="ptr__arrow"
        :class="{ 'ptr__arrow--armed': pull >= threshold }"
      />
    </div>
    <!-- No transform at rest. A transform makes this element the containing
         block for every `position: fixed` descendant, which would un-fix the
         mobile bottom tab bar and leave it at the foot of the document. -->
    <div
      class="ptr__body"
      :style="pull > 0 ? { transform: `translateY(${pull}px)` } : undefined"
      :class="{ 'ptr__body--settling': !tracking }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ptr {
  position: relative;
}
.ptr__indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: grid;
  place-items: end center;
  padding-bottom: 8px;
  overflow: hidden;
  color: rgb(var(--v-theme-primary));
  transition: opacity 0.15s ease;
  pointer-events: none;
}
.ptr__arrow {
  transition: transform 0.15s ease;
}
/* flips once the pull is far enough to trigger */
.ptr__arrow--armed {
  transform: rotate(180deg);
}
/* Present whenever the finger is off, so the class is already in place
   before pull returns to 0 rather than landing in the same frame. During
   the drag it's absent, so the content tracks the finger exactly. */
.ptr__body--settling {
  transition: transform 0.25s ease;
}
</style>
