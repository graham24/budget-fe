<script setup>
import { ref } from "vue";
import { uploadTransactions } from "../api";
import { useAccountStore } from "../stores/account";
import { useUserStore } from "../stores/user";
import { useTransactionStore } from "../stores/transaction";
import ImportReviewStack from "./ImportReviewStack.vue";

const accountsStore = useAccountStore();
const userStore = useUserStore();
const transactionStore = useTransactionStore();

const emit = defineEmits(["update:isOpen"]);

// Array to hold file objects with their selected account
const files = ref([]);
const uploading = ref(false);
const dragOver = ref(false);
// Post-upload review: imported transactions first, duplicates at the back
const reviewItems = ref([]);
const showReview = ref(false);

function handleFileSelect(event) {
  const selectedFiles = Array.from(event.target.files);
  addFiles(selectedFiles);
}

function handleFileDrop(event) {
  dragOver.value = false;
  const droppedFiles = Array.from(event.dataTransfer.files).filter(
    (file) =>
      file.type === "text/csv" ||
      file.name.endsWith(".csv") ||
      file.type === "application/json" ||
      file.name.endsWith(".json")
  );
  addFiles(droppedFiles);
}

function addFiles(fileList) {
  const newFiles = fileList.map((file) => ({
    id: Date.now() + Math.random(),
    file: file,
    accountId: null,
    status: "pending", // pending, uploading, success, error
    error: null,
  }));
  files.value.push(...newFiles);
}

function removeFile(fileId) {
  files.value = files.value.filter((f) => f.id !== fileId);
}

function getUser(userId) {
  return userStore.users.users.find((user) => user.id === userId);
}

function getAccount(accountId) {
  return accountsStore.accounts.accounts.find((a) => a.id === accountId);
}

function accountLabel(accountId) {
  const account = getAccount(accountId);
  return account ? `${account.description} (${account.bank})` : "Unknown account";
}

async function importAllTransactions() {
  // Validate all files have accounts selected
  const filesWithoutAccount = files.value.filter((f) => !f.accountId);
  if (filesWithoutAccount.length > 0) {
    alert("Please select an account for all files");
    return;
  }

  uploading.value = true;
  const imported = [];
  const duplicates = [];

  // Upload each file sequentially
  for (const fileObj of files.value) {
    fileObj.status = "uploading";
    try {
      const result = await uploadTransactions(fileObj.accountId, fileObj.file);
      fileObj.status = "success";
      imported.push(
        ...(result.imported_transactions ?? []).map((t) => ({
          kind: "imported",
          transaction: t,
          accountLabel: accountLabel(fileObj.accountId),
        }))
      );
      duplicates.push(
        ...(result.duplicate_transactions ?? []).map((t) => ({
          kind: "duplicate",
          transaction: t,
          accountLabel: accountLabel(fileObj.accountId),
        }))
      );
    } catch (error) {
      console.error(`Error uploading ${fileObj.file.name}:`, error);
      fileObj.status = "error";
      fileObj.error = error.response?.data?.message || "Upload failed";
    }
  }

  // Refresh transactions after all uploads
  await transactionStore.fetchTransactions(null, true);

  uploading.value = false;

  if (imported.length || duplicates.length) {
    // duplicates go to the back of the stack
    reviewItems.value = [...imported, ...duplicates];
    showReview.value = true;
  } else if (files.value.every((f) => f.status === "success")) {
    setTimeout(() => {
      emit("update:isOpen", false);
      files.value = [];
    }, 1000);
  }
}

async function finishReview() {
  showReview.value = false;
  reviewItems.value = [];
  files.value = [];
  // pick up any force-imported transactions
  await transactionStore.fetchTransactions(null, true);
  emit("update:isOpen", false);
}

function onDragOver(event) {
  event.preventDefault();
  dragOver.value = true;
}

function onDragLeave() {
  dragOver.value = false;
}
</script>

<template>
  <div class="import-form">
    <v-container v-if="showReview">
      <ImportReviewStack
        :items="reviewItems"
        @done="finishReview"
      />
    </v-container>
    <v-container v-else>
      <!-- File Drop Zone -->
      <div
        v-if="files.length === 0"
        class="drop-zone"
        :class="{ 'drag-over': dragOver }"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent="handleFileDrop"
      >
        <v-icon
          icon="mdi-cloud-upload"
          size="64"
          color="primary"
          class="mb-3"
        />
        <p class="text-h6 mb-2">
          Drop CSV or JSON files here
        </p>
        <p class="text-caption muted mb-4">
          or
        </p>
        <v-btn
          color="primary"
          variant="flat"
          @click="$refs.fileInput.click()"
        >
          Select Files
        </v-btn>
        <input
          ref="fileInput"
          type="file"
          multiple
          accept=".csv,.json"
          style="display: none"
          @change="handleFileSelect"
        >
      </div>

      <!-- File List -->
      <div v-else>
        <div class="d-flex justify-space-between align-center mb-4">
          <p class="text-subtitle-1 font-weight-medium">
            {{ files.length }} file{{ files.length !== 1 ? "s" : "" }} selected
          </p>
          <v-btn
            size="small"
            variant="text"
            prepend-icon="mdi-plus"
            @click="$refs.fileInput.click()"
          >
            Add More
          </v-btn>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept=".csv,.json"
            style="display: none"
            @change="handleFileSelect"
          >
        </div>

        <div class="file-list">
          <div
            v-for="fileObj in files"
            :key="fileObj.id"
            class="file-row"
          >
            <div class="file-info">
              <v-icon
                :icon="
                  fileObj.status === 'success'
                    ? 'mdi-check-circle'
                    : fileObj.status === 'error'
                      ? 'mdi-alert-circle'
                      : fileObj.status === 'uploading'
                        ? 'mdi-loading'
                        : 'mdi-file-document'
                "
                :color="
                  fileObj.status === 'success'
                    ? 'success'
                    : fileObj.status === 'error'
                      ? 'error'
                      : 'primary'
                "
                :class="{ 'rotating': fileObj.status === 'uploading' }"
                size="20"
              />
              <span class="file-name">{{ fileObj.file.name }}</span>
              <span class="file-size muted">
                ({{ (fileObj.file.size / 1024).toFixed(1) }} KB)
              </span>
            </div>

            <div class="file-actions">
              <v-select
                v-model="fileObj.accountId"
                label="Account"
                density="compact"
                class="account-select"
                :items="accountsStore.accounts.accounts"
                :item-title="
                  (item) =>
                    `${getUser(item.user_id)?.first_name ?? 'Unknown'}: ${item.description}: ${
                      item.bank
                    } ${item.type}`
                "
                item-value="id"
                :disabled="fileObj.status === 'uploading' || fileObj.status === 'success'"
              />

              <v-btn
                v-if="fileObj.status !== 'uploading'"
                icon="mdi-close"
                variant="text"
                size="small"
                :disabled="uploading"
                @click="removeFile(fileObj.id)"
              />
            </div>
          </div>
        </div>

        <div class="mt-4 d-flex justify-end gap-2">
          <v-btn
            variant="text"
            :disabled="uploading"
            @click="emit('update:isOpen', false)"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="uploading"
            :disabled="files.length === 0"
            @click="importAllTransactions"
          >
            Import {{ files.length }} File{{ files.length !== 1 ? "s" : "" }}
          </v-btn>
        </div>
      </div>
    </v-container>
  </div>
</template>

<style scoped>
.import-form {
  min-height: 300px;
}

.drop-zone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
  border-radius: var(--radius-xs);
  padding: 48px 24px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.drop-zone:hover,
.drop-zone.drag-over {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.file-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: var(--radius-xs);
  gap: 16px;
}

.account-select {
  min-width: 300px;
  max-width: 400px;
}

@media (max-width: 700px) {
  .file-row {
    flex-direction: column;
    align-items: stretch;
  }
  .file-info {
    max-width: none;
  }
  .file-actions {
    width: 100%;
  }
  .account-select {
    min-width: 0;
    max-width: none;
    flex: 1;
  }
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 200px;
  max-width: 300px;
}

.file-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.file-size {
  font-size: 0.85rem;
  white-space: nowrap;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 0 auto;
  justify-content: flex-end;
  min-width: 0;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.gap-2 {
  gap: 8px;
}
</style>
