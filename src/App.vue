<template>
  <div v-if="!authStore.user">
    <v-container>
      <v-row justify="center" align="center">
        <p>
          This is a simple budget app. It allows you to track your income and
          expenses and categorize with the help of AI.
          <br />
          You can log in with your Google account to get started.
        </p>
      </v-row>
      <v-row justify="center" align="center">
        <v-col cols="auto">
          <p class="text-h6 text-center mb-4">Please log in</p>
          <div
            id="g_id_onload"
            data-client_id="465424205396-qhqvcr1cpm5ilkor7kldpq41nhcn80jg.apps.googleusercontent.com"
            data-callback="handleCredentialResponse"
            data-auto_prompt="false"
          ></div>
          <div class="g_id_signin" data-type="standard"></div>
        </v-col>
      </v-row>
    </v-container>
  </div>
  <div v-else>
    <div>
      <v-btn v-if="authStore.user" @click="logout" class="ma-2" color="primary"
        >Logout</v-btn
      >
    </div>
    <v-app>
      <v-main>
        <router-view />
      </v-main>
    </v-app>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const clientId =
  "465424205396-qhqvcr1cpm5ilkor7kldpq41nhcn80jg.apps.googleusercontent.com";

onMounted(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    authStore.verifyUser(JSON.parse(storedUser));
  } else {
    window.handleCredentialResponse = (response) => {
      const token = response.credential;
      const data = parseJwt(token);
      authStore.login(token, data);
    };
  }
});

function parseJwt(token) {
  return JSON.parse(atob(token.split(".")[1]));
}

function logout() {
  authStore.logout();
}
</script>
