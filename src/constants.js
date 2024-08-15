export default class Constants {
  static CLUBID = 4509;
  static API = "https://www.sponsorkliks.com/api/?club="+this.CLUBID+"&call=webshops_club_extension";
  static UPDATE_CHECK_INTERVAL = 600;
  static UPDATE_CHECK_ALARM_NAME = "update-sponsor-links-alarm";
  static SPONSOR_DOMAINS_STORAGE_KEY = 'sponsor-domains';
  static LASTCHECK_KEY = 'lastcheck';
  static ALWAYS_REDIRECT_KEY = 'always-redirect';
  static NOTIFICATION_ID = 'sponsor-notification-';

  static BROWSER = typeof browser === 'undefined' ? chrome : browser;
}
