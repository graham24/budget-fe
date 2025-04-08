<script setup>
import { useTransactionStore } from "../stores/transaction";

const transactionStore = useTransactionStore();

defineOptions({
  methods: {
    formatDate(date) {
      const options = { year: "numeric", month: "long" };
      return new Date(date).toLocaleDateString(undefined, options);
    },
    formatCurrency(amount) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    },
  },
});
</script>
<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>
          {{
            formatDate(
              new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
              ).setMonth(
                new Date().getMonth() - (transactionStore.monthsAgo + 1)
              )
            )
          }}
          Net Income
        </h1>
      </v-col>
    </v-row>
    <v-row>
      <v-col
        :class="[
          transactionStore.net_incomes[0 + transactionStore.monthsAgo][
            'income'
          ] +
            transactionStore.net_incomes[0 + transactionStore.monthsAgo][
              'expenses'
            ] >=
          0
            ? 'positive'
            : 'negative',
        ]"
      >
        {{
          formatCurrency(
            transactionStore.net_incomes[0 + transactionStore.monthsAgo][
              "income"
            ] +
              transactionStore.net_incomes[0 + transactionStore.monthsAgo][
                "expenses"
              ]
          )
        }}
      </v-col>
    </v-row>
    <v-row>
      <v-col class="positive">
        {{
          formatCurrency(
            transactionStore.net_incomes[0 + transactionStore.monthsAgo][
              "income"
            ]
          )
        }}
      </v-col>
      <v-col class="negative">
        {{
          formatCurrency(
            transactionStore.net_incomes[0 + transactionStore.monthsAgo][
              "expenses"
            ]
          )
        }}
      </v-col>
    </v-row>
    <v-row v-for="(value, key) in transactionStore.net_incomes" :key="key">
      <v-col v-if="key !== 0 && transactionStore.net_incomes[key + transactionStore.monthsAgo]"
        >{{
          formatDate(
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ).setMonth(
              new Date().getMonth() - (key + transactionStore.monthsAgo + 1)
            )
          )
        }}:
        <span
          :class="[
            transactionStore.net_incomes[key + transactionStore.monthsAgo][
              'income'
            ] +
              transactionStore.net_incomes[key + transactionStore.monthsAgo][
                'expenses'
              ] >=
            0
              ? 'positive'
              : 'negative',
          ]"
          >{{
            formatCurrency(
              transactionStore.net_incomes[key + transactionStore.monthsAgo][
                "income"
              ] +
                transactionStore.net_incomes[key + transactionStore.monthsAgo][
                  "expenses"
                ]
            )
          }}</span
        ></v-col
      >
    </v-row>
  </v-container>
  <!-- <v-card>
    <v-row
      :class="['previous-months']"
      v-for="(value, key) in transactionStore.net_incomes"
      :key="key"
    >
      <v-container>
        <v-row>
          <v-col>
            <span :class="key === 0 ? 'widget-title' : ''">
              <span
                >{{
                  formatDate(
                    new Date(
                      new Date().getFullYear(),
                      new Date().getMonth(),
                      1
                    ).setMonth(new Date().getMonth() - (key + 2))
                  )
                }}
                <span v-if="key === 0">Net Income<br /></span>
                <span v-else>: </span>
              </span>
            </span>
          </v-col>
        </v-row>
        <v-row>
          <v-col
            :class="[
              key === 0 ? 'net' : '',
              transactionStore.net_incomes[key]['income'] +
                transactionStore.net_incomes[key]['expenses'] >=
              0
                ? 'net-positive'
                : 'net-negative',
            ]"
          >
            {{
              formatCurrency(
                transactionStore.net_incomes[key]["income"] +
                  transactionStore.net_incomes[key]["expenses"]
              )
            }}
          </v-col>
        </v-row>
        <v-row class="income-expenses" v-if="key === 0">
          <v-col>
            <span class="income">{{
              formatCurrency(transactionStore.net_incomes[key]["income"])
            }}</span>
          </v-col>
          <v-col>
            <span class="expenses">{{
              formatCurrency(transactionStore.net_incomes[key]["expenses"])
            }}</span>
          </v-col>
        </v-row>
      </v-container>
    </v-row>
  </v-card> -->
</template>

<style scoped>
.net {
  font-size: 3em;
  font-weight: 700;
}
.income-expenses {
  display: flex;
  justify-content: center;
  column-gap: 10px;
  font-size: 1.2em;
}
.income,
.positive {
  color: green;
}
.expenses,
.negative {
  color: red;
}
.previous-months {
  font-size: 0.9em;
}
</style>
