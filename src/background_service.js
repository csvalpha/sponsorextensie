import Constants from "./constants.js";
import Functions from "./functions.js";

const functions = new Functions();
functions.checkUpdateUrls();
setAlarm();

chrome.tabs.onUpdated.addListener(functions.onTabUpdated.bind(functions));

async function setAlarm() {
  const alarm = await chrome.alarms.get(Constants.UPDATE_CHECK_ALARM_NAME);

  if (!alarm) {
    // Register for periodic endpoint updates
    await chrome.alarms.create("update-sponsor-links-alarm", {
      delayInMinutes: Constants.UPDATE_CHECK_INTERVAL,
      periodInMinutes: Constants.UPDATE_CHECK_INTERVAL
    });

    chrome.alarms.onAlarm.addListener(function (alarm) {
      if (alarm.name === Constants.UPDATE_CHECK_ALARM_NAME) {
        functions.updateUrls();
      }
    });
  }
}