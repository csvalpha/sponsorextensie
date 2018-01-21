var sponsorkliks = [];

checkUpdate();

browser.webNavigation.onCompleted.addListener(navigationCompleteListener);

// GC closing tabs to keep sponsorkliks map clean
browser.tabs.onRemoved.addListener(function (tabId) {
    if (sponsorkliks[tabId]) {
        delete sponsorkliks[tabId];
    }
    browser.notifications.clear(NOTIFICATION_ID);
});

// Register for periodic endpoint updates
browser.runtime.onInstalled.addListener(function () {
    browser.alarms.create("SKupdateCheck", {
        delayInMinutes: UPDATE_CHECK_INTERVAL,
        periodInMinutes: UPDATE_CHECK_INTERVAL
    })
});

browser.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === "SKupdateCheck") {
        checkUpdate();
    }
});