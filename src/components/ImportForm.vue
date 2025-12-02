<script setup>
import { ref } from "vue";
import { useImportStore } from "../stores/import";
import { useAccountStore } from "../stores/account";
import { useUserStore } from "../stores/user";

const importStore = useImportStore();
const accountsStore = useAccountStore();
const userStore = useUserStore();
const loading = ref(false);
const emit = defineEmits(["update:isOpen"]);

function selectFile(event) {
  console.log(event.target.files);
  importStore.importFile = event.target.files[0];
}

function getUser(userId) {
  return userStore.users.users.find((user) => user.id === userId);
}

function importTransactions() {
  loading.value = true;
  importStore.importTransactions().then(() => {
    loading.value = false;
    emit("update:isOpen", false);
  });
}
</script>
<template>
  <div>
    <v-form>
      <v-container>
        <v-row v-if="loading">
          <v-col>
            <v-progress-circular indeterminate></v-progress-circular>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="importStore.accountId"
              label="Account"
              required
              :items="accountsStore.accounts.accounts"
              :item-title="
                (item) =>
                  `${getUser(item.user_id).first_name}: ${item.description}: ${
                    item.bank
                  } ${item.type}`
              "
              item-value="id"
            ></v-select>
          </v-col>

          <v-col cols="12" md="6">
            <v-file-input
              :v-slot:selection="selectFile"
              @change="selectFile"
              label="Select File"
              accept=".csv"
            ></v-file-input>
          </v-col>
        </v-row>
        <v-btn @click="importTransactions()">Import</v-btn>
      </v-container>
    </v-form>
  </div>
</template>
