<script setup lang="ts">
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const login = () => {
  window.location.href = "http://localhost:5000/api/auth/login";
};
</script>

<template>
  <div>
    <h1>Login</h1>
    <button @click="login">Login with Google</button>
  </div>
</template>
