"use strict";

import { Notify } from "quasar";

function notify(msg) {
  Notify.create({
    message: msg,
    color: "dark",
    timeout: 2000,
    icon: "mdi-information-outline",
  });
}

function notifyOk(msg) {
  Notify.create({
    message: msg,
    color: "positive",
    timeout: 3000,
    icon: "mdi-check-bold",
  });
}

function notifyWarning(msg) {
  Notify.create({
    message: msg,
    color: "warning",
    timeout: 4000,
    icon: "mdi-alert-octagram-outline",
  });
}

function notifyError(msg) {
  Notify.create({
    message: msg,
    color: "negative",
    timeout: 5000,
    icon: "mdi-alert-outline",
  });
}

export { notify, notifyOk, notifyWarning, notifyError };
