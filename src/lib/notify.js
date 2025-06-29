"use strict";

import { Notify } from "quasar";

function notify(msg) {
  Notify.create({
    message: msg,
    color: "zcolor-notify",
    textColor: "zcolor-notify",
    timeout: 2000,
    icon: "mdi-information-outline",
  });
}

function notifyOk(msg) {
  Notify.create({
    message: msg,
    color: "zcolor-ok",
    textColor: "zcolor-ok",
    timeout: 3000,
    icon: "mdi-check-bold",
  });
}

function notifyWarning(msg) {
  Notify.create({
    message: msg,
    color: "zcolor-warning",
    textColor: "zcolor-warning",
    timeout: 4000,
    icon: "mdi-alert-octagram-outline",
  });
}

function notifyError(msg) {
  Notify.create({
    message: msg,
    color: "zcolor-error",
    timeout: 5000,
    icon: "mdi-alert-outline",
  });
}

export { notify, notifyOk, notifyWarning, notifyError };
