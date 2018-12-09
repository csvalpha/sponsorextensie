/**
 * Called when the DOM is loaded
 * Restores the saved settings
 */
function restoreOptions() {
    getStorage(ALWAYS_REDIRECT_KEY, storage => {
        if (storage[ALWAYS_REDIRECT_KEY]) {
            document.getElementById('always-redirect').checked = true;
        }
    });
}
document.addEventListener('DOMContentLoaded', restoreOptions);

/**
 * Called when the form is submitted
 * @param e {object} submit event
 */
function saveOptions(e) {
    e.preventDefault();

    browser.storage.local.set({
        [ALWAYS_REDIRECT_KEY]: document.querySelector('#always-redirect').checked
    });
}
document.getElementById('settings').addEventListener('submit', saveOptions);