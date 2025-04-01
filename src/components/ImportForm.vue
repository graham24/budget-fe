<script setup>
import { useImportStore } from "../stores/import";
import { useAccountStore } from "../stores/account";
import { useUserStore } from "../stores/user";


const importStore = useImportStore();
const accountsStore = useAccountStore();
const userStore = useUserStore();

function selectFile(event) {
  console.log(event.target.files);
  importStore.importFile = event.target.files[0];
}

function getUser(userId) {
  return userStore.users.users.find(user => user.id === userId);
}


</script>
<template>
  <div>
    <div><h3>Import Transactions:</h3></div>
    <div>
      <label for="account-select">Choose Account:</label>
      <select
        name="accounts"
        id="account-select"
        v-model="importStore.accountId"
      >
        <option value=""></option>
        <option
          v-for="account in accountsStore.accounts.accounts"
          :value="account.id"
        >
          {{ getUser(account.user_id).first_name }}: {{ account.description }}: {{ account.bank }} ({{ account.type }})
        </option>
      </select>
    </div>
    <div>
      <input type="file" id="file-import" accept=".csv" @change="selectFile" />
      <div>
        <button type="button" @click="importStore.importTransactions()">
          Import
        </button>
      </div>
    </div>
  </div>
</template>
