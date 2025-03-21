<script setup lang="ts">
</script>

<template>
  <div id="app">
    <nav>
      <router-link to="/">Home</router-link>
      <!-- <router-link to="/dashboard">Dashboard</router-link> -->
      <router-link to="/login">Login</router-link>
    </nav>

    <!-- This is where the routed pages will be displayed -->
    <router-view />
  </div>
</template>

<style scoped>
nav {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
</style>
