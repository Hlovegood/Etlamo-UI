// View helpers receive the existing language, escaping and form utilities.
export function accountView({t,escape,option,account,register,journey}) {
  if(account) return `<section class="page-title"><h1>${t('accountTitle')}</h1><p><bdi>${escape(account.email)}</bdi> · ${t(account.role)}</p></section><div class="form-panel account-panel"><p>${t('accountLocal')}</p><p class="local-status">${t(account.emailVerified?'emailVerifiedPreview':'emailUnverified')}</p>${account.emailVerified?'':`<button class="button button-outline" data-action="request-verification">${t('requestVerifyLink')}</button>`}<p><a class="text-link" href="#/account/mail-preview">${t('localMailbox')}</a> · <a class="text-link" href="#/account/recover">${t('resetPassword')}</a></p>${account.isAdmin?`<a class="button" href="#/admin">${t('adminReview')}</a>`:''}${account.role==='vendor'?`<a class="button" href="#/vendor">${t('vendorDashboard')}</a>`:`<a class="button" href="#/requests">${t('requests')}</a>`}<button class="button button-outline" data-action="logout">${t('signOut')}</button></div>`;
  const isAr = document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
  return `<div class="expandable-screen-wrap" data-expandable-screen="true" data-layout-id="account-screen">
    <div class="expandable-screen-card is-embedded" style="--content-radius: 0px;">
      <div class="expandable-screen-header">
        <h1 class="expandable-screen-title">${t(register?'createAccount':'signIn')}</h1>
        <a href="#/discover" class="expandable-screen-close" aria-label="${isAr?'إغلاق':'Close'}" title="${isAr?'إغلاق':'Close'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </a>
      </div>
      <div class="expandable-screen-content">
        <p class="expandable-screen-intro">${t('accountIntro')}</p>
        <form id="account-form" data-mode="${register?'register':'login'}" class="form-panel account-panel"><div class="form-field"><label for="account-email">${t('email')}</label><input id="account-email" name="email" type="email" dir="ltr" maxlength="254" autocomplete="email" required></div><div class="form-field"><label for="account-password">${t('password')}</label><input id="account-password" name="password" type="password" dir="ltr" minlength="12" maxlength="128" autocomplete="${register?'new-password':'current-password'}" aria-describedby="password-help" required><small id="password-help">${t('passwordHelp')}</small></div>${register?`<div class="form-field"><label for="account-role">${t('accountType')}</label><select id="account-role" name="role">${option('customer',t('customer'),'customer')}${option('vendor',t('vendor'),'customer')}</select></div>`:''}<p class="fine-print">${t('accountLocal')}</p><p id="account-error" class="form-error" role="alert" hidden></p><button class="button full-width" type="submit">${t(register?'createAccount':'signIn')}</button><p><a class="text-link" href="#/account${register?'':'/register'}${journey?`?journey=${journey}`:''}">${t(register?'haveAccount':'needAccount')}</a></p>${register?'':`<p><a class="text-link" href="#/account/recover">${t('forgotPassword')}</a></p>`}</form>
      </div>
    </div>
  </div>`;
}
export { venueForm } from './catalog-views.js';
