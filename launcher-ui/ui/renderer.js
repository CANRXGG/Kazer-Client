'use strict';

const state = {
  version: '1.7.10',
  memory: 4096,
  javaPath: '',
  loggedIn: false,
  authConfigured: true,
  accounts: [],
  activeAccount: null,
  busy: false,
  busyAccountIds: [],
  servers: [],
  serversLoaded: false,
  serversRefreshing: false,
  language: 'en',
  preallocateMemory: false,
  resolutionWidth: 854,
  resolutionHeight: 480,
  fullscreen: false,
  jvmArgs: '',
  intelPerformance: true,
  onGameError: 'ignore',
  onGameCrash: 'prompt',
  onGameLaunch: 'hide',
  onGameClose: 'restore'
};

const $ = (selector) => document.querySelector(selector);
const bridge = window.kazer || null;
let settingsSaveTimer;
let serverRefreshTimer;
let updateDownloadRequested = false;
let lastCrashReport = null;
let lastNotice = '';

const TRANSLATIONS = {
  'zh-CN': {
    initializing: '正在初始化服务…', home: '主页', servers: '服务器', settings: '设置', about: '关于', launch: '启动', launching: '正在启动…',
    gameVersion: '游戏版本', serversOnline: '个服务器在线', autoRefresh: '每 30 秒自动刷新', advanced: '显示高级设置', game: '游戏', launcher: '启动器', reset: '重置',
    ramAllocation: '运行内存', ramHelp: '游戏最多可以使用多少内存。', preallocate: '预分配', resolution: '分辨率', resolutionHelp: '游戏窗口使用的尺寸。', fullscreen: '全屏',
    javaHelp: '自动检测 Java，或手动选择运行环境。', autoDetect: '自动检测', browse: '浏览', jvmHelp: '附加安全的 Java 启动参数。', intelHelp: '启用低延迟垃圾回收参数。', enabled: '启用',
    gameError: '游戏错误时', gameErrorHelp: '游戏返回错误代码时的操作。', ignoreError: '忽略错误', showLogs: '显示日志', gameCrash: '游戏崩溃时', gameCrashHelp: '发生崩溃时的操作。', crashPrompt: '显示崩溃提示',
    language: '语言', languageHelp: '选择启动器显示语言。', onLaunch: '游戏启动时', onLaunchHelp: '启动游戏后如何处理启动器。', keepOpen: '保持打开', minimize: '最小化', hideLauncher: '隐藏到托盘',
    onClose: '游戏关闭时', onCloseHelp: '游戏退出后如何处理启动器。', keepState: '保持状态', restoreLauncher: '恢复启动器', closeLauncher: '退出启动器', gameDirectory: '游戏目录', gameDirectoryHelp: 'Minecraft 使用的本地目录。', downloadDirectory: '下载目录', downloadDirectoryHelp: '启动器资源缓存目录。',
    resetLauncher: '重置启动器', resetLauncherHelp: '恢复内存、窗口和启动行为的默认值。', resetSettings: '重置启动器设置', resetMinecraft: 'Minecraft 维护', resetMinecraftHelp: '游戏文件继续使用官方目录，避免误删世界与服务器。', openFolder: '打开游戏目录', online: '在线', offline: '离线', waiting: '等待刷新',
    notLoggedIn: '未登录', gameAccounts: '游戏账号', loginAccount: '登录新账号', removeAccount: '移除当前账号', readingState: '正在读取启动器状态…', noServers: '还没有服务器', serverInitializing: 'Kazer Network 正在初始化。', launcherReady: '启动器就绪。', clickLogin: '点击左上角账号区域登录 Microsoft 账号。', noJava: '未找到 Java，将在需要时尝试使用内置 Java 8。', refreshingServers: '正在读取服务器状态…', refreshedServers: '刚刚刷新', refreshFailed: '刷新失败', updateAvailableTitle: '发现新版本', updateAvailableBody: 'Kazer Client {version} 已发布，是否立即更新？', updateNow: '立即更新', updateDownloading: '正在下载更新…', updateInstalling: '下载完成，正在安装…', updateWaitingForGame: '下载完成，将在游戏退出后安装。', updateDownloadFailed: '更新下载失败，请稍后重试。'
  },
  en: {
    initializing: 'Initializing services…', home: 'HOME', servers: 'SERVERS', settings: 'SETTINGS', about: 'ABOUT', launch: 'LAUNCH', launching: 'CONNECTING…',
    gameVersion: 'Game version', serversOnline: 'servers online', autoRefresh: 'Refreshes every 30 seconds', advanced: 'Show advanced', game: 'Game', launcher: 'Launcher', reset: 'Reset',
    ramAllocation: 'RAM Allocation', ramHelp: 'How much memory the game can use.', preallocate: 'Preallocate', resolution: 'Resolution', resolutionHelp: 'The size of the game window.', fullscreen: 'Fullscreen',
    javaHelp: 'Detect Java automatically or select a runtime.', autoDetect: 'Auto detect', browse: 'Browse', jvmHelp: 'Append safe Java launch arguments.', intelHelp: 'Enable low-latency garbage collection flags.', enabled: 'Enabled',
    gameError: 'On Game Error', gameErrorHelp: 'What to do when the game returns an error.', ignoreError: 'Ignore Game Error', showLogs: 'Show Logs', gameCrash: 'On Game Crash', gameCrashHelp: 'What to do when the game crashes.', crashPrompt: 'Show Crash Prompt',
    language: 'Language', languageHelp: 'Choose the launcher display language.', onLaunch: 'On Game Launch', onLaunchHelp: 'What to do with the launcher after launch.', keepOpen: 'Keep Open', minimize: 'Minimize', hideLauncher: 'Hide to Tray',
    onClose: 'On Game Close', onCloseHelp: 'What to do after the game exits.', keepState: 'Keep State', restoreLauncher: 'Restore Launcher', closeLauncher: 'Close Launcher', gameDirectory: 'Game Directory', gameDirectoryHelp: 'The local directory used by Minecraft.', downloadDirectory: 'Downloads Directory', downloadDirectoryHelp: 'The launcher resource cache directory.',
    resetLauncher: 'Reset Launcher', resetLauncherHelp: 'Restore memory, window and launch behavior defaults.', resetSettings: 'Reset Launcher Settings', resetMinecraft: 'Minecraft Maintenance', resetMinecraftHelp: 'Use the official game directory without deleting worlds or servers.', openFolder: 'Open Game Directory', online: 'Online', offline: 'Offline', waiting: 'Waiting',
    notLoggedIn: 'Not signed in', gameAccounts: 'Game accounts', loginAccount: 'Add Microsoft Account', removeAccount: 'Remove current account', readingState: 'Reading launcher state…', noServers: 'No servers yet', serverInitializing: 'Kazer Network is initializing.', launcherReady: 'Launcher ready.', clickLogin: 'Use the account area at the top left to sign in with Microsoft.', noJava: 'Java was not found; bundled Java 8 will be tried when needed.', refreshingServers: 'Reading server status…', refreshedServers: 'Just refreshed', refreshFailed: 'Refresh failed', updateAvailableTitle: 'Update available', updateAvailableBody: 'Kazer Client {version} is available. Update now?', updateNow: 'Update now', updateDownloading: 'Downloading update…', updateInstalling: 'Download complete. Installing…', updateWaitingForGame: 'Download complete. It will install after the game closes.', updateDownloadFailed: 'Update download failed. Please try again later.'
  }
};

let releaseNews = null;

function applyReleaseNews(news) {
  if (!news?.version || !news?.date || !news?.notes) throw new Error('Missing release notes');
  releaseNews = news;
  if ($('#news-title')) $('#news-title').textContent = `Kazer Client v${news.version}-${news.buildId}`;
  const date = $('.news-date');
  if (date) {
    date.dateTime = news.date;
    date.textContent = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
    }).format(new Date(`${news.date}T00:00:00Z`)).toUpperCase();
  }
  applyLanguage(state.language);
}
Object.assign(TRANSLATIONS['zh-CN'], {
  sessionReady: '启动游戏以查看详情。', currentAccount: '当前账号', accountHelp: '从左上角添加或切换 Microsoft 账号。',
  aboutIntro: 'Kazer Client 提供稳定、简洁的 Minecraft PvP 客户端体验，并由启动器自动管理更新与运行环境。',
  launcherInfo: '启动器', versionLabel: '版本', branchLabel: '分支', localeLabel: '语言', systemInfo: '系统', memoryLabel: '内存',
  resources: '资源', joinQq: '加入 QQ 群', logs: '日志', logsFolder: '日志文件夹', latestLog: '最新日志', socials: '社区',
  communityHint: 'QQ群号 515518957。点击按钮会复制群号并尝试打开 QQ。', notAffiliated: '与 Mojang Studios 无关联。',
  crashTitle: '糟糕，游戏发生了异常', crashDetails: '崩溃详情', copy: '复制', openLogs: '打开日志', selfDiagnostics: '自助诊断',
  logViewer: '日志查看器', crashHelp: '如果问题反复出现，请联系支持并附上 Crash ID。', diagnostics: '诊断结果',
});
Object.assign(TRANSLATIONS.en, {
  sessionReady: 'Launch game to view details.', currentAccount: 'Current Account', accountHelp: 'Add or switch Microsoft accounts in the top-left menu.',
  aboutIntro: 'Kazer Client provides a stable and focused Minecraft PvP experience while the launcher manages updates and the runtime.',
  launcherInfo: 'Launcher', versionLabel: 'Version', branchLabel: 'Branch', localeLabel: 'Locale', systemInfo: 'System', memoryLabel: 'Memory',
  resources: 'Resources', joinQq: 'Join QQ Group', logs: 'Logs', logsFolder: 'Logs Folder', latestLog: 'Latest Log', socials: 'Socials',
  communityHint: 'QQ group 515518957. The button copies the group number and tries to open QQ.', notAffiliated: 'Not affiliated with Mojang Studios.',
  crashTitle: 'Oh no, something went wrong with your game', crashDetails: 'Crash details', copy: 'Copy', openLogs: 'Open Logs',
  selfDiagnostics: 'Self diagnostics', logViewer: 'Log viewer', crashHelp: 'If this keeps happening, contact support and include the Crash ID.', diagnostics: 'Diagnostics',
});

function tr(key) {
  if (key.startsWith('news')) return releaseNews?.notes[state.language]?.[key] || '';
  return TRANSLATIONS[state.language]?.[key] || TRANSLATIONS.en[key] || key;
}

function applyLanguage(language) {
  state.language = language === 'zh-CN' ? 'zh-CN' : 'en';
  document.documentElement.lang = state.language;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const value = tr(element.dataset.i18n);
    if (value) element.textContent = value;
  });
  if ($('#language-select')) $('#language-select').value = state.language;
  if ($('#language-label')) $('#language-label').textContent = state.language === 'en' ? 'English' : '简体中文';
  document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.language === state.language)));
  if ($('#about-locale')) $('#about-locale').textContent = state.language;
  if (!state.loggedIn && $('#account-name')) $('#account-name').textContent = tr('notLoggedIn');
  syncLaunchState();
  renderAccounts();
  renderServers();
  if ($('#session-account')) $('#session-account').textContent = state.activeAccount ? accountName(state.activeAccount) : tr('notLoggedIn');
}

function errorText(error) {
  return error && error.message ? error.message : String(error);
}

function hasApi(name) {
  return Boolean(bridge && typeof bridge[name] === 'function');
}

async function callApi(name, ...args) {
  if (!hasApi(name)) throw new Error(`启动器接口不可用：${name}`);
  return bridge[name](...args);
}

function accountName(account) {
  if (!account) return '';
  return account.username || account.name || account.profileName || account.displayName || '';
}

function accountId(account) {
  if (!account) return '';
  return String(account.id || account.homeAccountId || account.uuid || account.xuid || account.username || account.name || '').toLowerCase();
}

function applySkinAvatar(element, account) {
  if (!element) return;
  const avatarDataUrl = account && typeof account.avatarDataUrl === 'string' ? account.avatarDataUrl : '';
  const skinUrl = account && typeof account.skinUrl === 'string' ? account.skinUrl : '';
  const source = avatarDataUrl || skinUrl || (accountName(account) ? '../assets/default-player-skin.png' : '');
  element.classList.toggle('has-skin', Boolean(source));
  element.classList.toggle('cropped-avatar', Boolean(avatarDataUrl));
  element.style.backgroundImage = source ? `url("${source.replace(/["\\]/g, '')}")` : '';
}

function upsertAccount(account) {
  if (!account || !accountName(account)) return;
  const id = accountId(account);
  state.accounts = state.accounts.filter((item, index, all) => {
    const itemId = accountId(item);
    return itemId !== id && all.findIndex((candidate) => accountId(candidate) === itemId) === index;
  });
  state.accounts.unshift(account);
}

function classifyStatus(message, explicitType) {
  if (explicitType) return explicitType;
  const text = String(message || '');
  if (/失败|错误|不可用|没有找到|未配置|禁用/.test(text)) return 'error';
  if (/正在|等待|准备|查找|下载|登录/.test(text)) return 'busy';
  if (/成功|已找到|已选择|已复制|已退出|欢迎|就绪/.test(text)) return 'success';
  return 'neutral';
}

function setStatus(message, type) {
  const wrap = $('.status-wrap');
  const status = $('#status');
  if (!status) return;
  status.textContent = message;
  if (wrap) {
    wrap.classList.remove('success', 'error', 'busy');
    const next = classifyStatus(message, type);
    if (next !== 'neutral') wrap.classList.add(next);
    if (next === 'error') showNotice(state.language === 'zh-CN' ? '需要注意' : 'Attention', message, 'error');
  }
}

function showNotice(title, message, kind = 'info') {
  const host = $('#launcher-notices');
  if (!host) return;
  const key = `${kind}:${title}:${message}`;
  if (key === lastNotice) return;
  lastNotice = key;
  const card = document.createElement('div');
  card.className = `launcher-notice ${kind}`;
  card.tabIndex = 0;
  const icon = document.createElement('span');
  icon.className = 'notice-icon';
  icon.textContent = kind === 'error' ? '!' : kind === 'update' ? '↻' : '✓';
  const copy = document.createElement('div');
  const heading = document.createElement('strong');
  heading.textContent = title;
  const detail = document.createElement('p');
  detail.textContent = String(message || '');
  copy.append(heading, detail);
  card.append(icon, copy);
  host.prepend(card);
  while (host.children.length > 3) host.lastElementChild.remove();
  window.setTimeout(() => card.classList.add('collapsed'), 4500);
  window.setTimeout(() => { if (card.isConnected) card.remove(); if (lastNotice === key) lastNotice = ''; }, 14000);
}

function formatBytes(value) {
  const bytes = Math.max(0, Number(value) || 0);
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function showUpdateToast(info) {
  const version = String(info?.version || '').trim();
  $('#update-toast-title').textContent = tr('updateAvailableTitle');
  $('#update-toast-body').textContent = tr('updateAvailableBody').replace('{version}', version ? `v${version}` : '');
  $('#update-now').textContent = tr('updateNow');
  $('#update-now').disabled = false;
  $('#update-toast').classList.remove('hidden');
  $('#update-toast').classList.remove('collapsed');
  window.setTimeout(() => $('#update-toast')?.classList.add('collapsed'), 4500);
}

function showUpdateProgress() {
  $('.home-footer')?.classList.add('update-active');
  $('#update-progress')?.classList.remove('hidden', 'error', 'complete');
}

function renderUpdateProgress(progress) {
  showUpdateProgress();
  const total = Math.max(0, Number(progress?.total) || 0);
  const transferred = Math.max(0, Number(progress?.transferred) || 0);
  const percent = Math.max(0, Math.min(100, Number(progress?.percent) || 0));
  $('#update-progress-label').textContent = tr('updateDownloading');
  $('#update-progress-percent').textContent = `${Math.round(percent)}%`;
  $('#update-progress-bar').style.width = `${percent}%`;
  $('#update-progress-meta').textContent = `${formatBytes(transferred)} / ${formatBytes(total)}\n${formatBytes(progress?.bytesPerSecond)}/s`;
}

function syncLaunchState() {
  const button = $('#launch');
  if (!button) return;
  const running = selectedAccountRunning();
  button.disabled = state.busy || running || !state.loggedIn || !state.javaPath;
  button.classList.toggle('is-busy', state.busy);
  const label = $('.button-label');
  if (label) label.textContent = state.busy ? tr('launching') : running
    ? (state.language === 'zh-CN' ? '运行中' : 'RUNNING') : `${tr('launch')} ${state.version}`;
  if ($('#session-account')) $('#session-account').textContent = state.activeAccount ? accountName(state.activeAccount) : tr('notLoggedIn');
}
function selectedAccountRunning() {
  return state.busyAccountIds.includes(String(accountId(state.activeAccount) || '').replace(/-/g, '').toLowerCase());
}

function syncJavaVisual() {
  const wrap = $('.java-path-wrap');
  if (wrap) wrap.classList.toggle('valid', Boolean(state.javaPath));
  if ($('#java-path')) $('#java-path').value = state.javaPath || '';
}

function setBusy(busy) {
  state.busy = Boolean(busy);
  syncLaunchState();
  const label = $('.button-label');
  if ($('#add-account')) $('#add-account').disabled = state.busy;
}

function renderAccounts() {
  const list = $('#account-list');
  if (!list) return;
  list.textContent = '';

  const accounts = state.accounts.filter((account) => accountName(account));
  $('#account-count').textContent = state.language === 'zh-CN' ? `${accounts.length} 个账号` : `${accounts.length} account${accounts.length === 1 ? '' : 's'}`;

  if (!accounts.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:11px 7px 7px;color:#6f7a87;font-size:9px;text-align:center;';
    empty.textContent = state.language === 'zh-CN' ? '还没有保存的账号' : 'No saved accounts';
    list.appendChild(empty);
    return;
  }

  accounts.forEach((account) => {
    const name = accountName(account);
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'account-row';
    row.dataset.accountId = accountId(account);
    row.classList.toggle('active', Boolean(state.activeAccount) && accountId(state.activeAccount) === accountId(account));

    const avatar = document.createElement('span');
    avatar.className = 'account-row-avatar';
    avatar.textContent = '';
    applySkinAvatar(avatar, account);

    const copy = document.createElement('span');
    const strong = document.createElement('strong');
    const small = document.createElement('small');
    strong.textContent = name;
    small.textContent = state.language === 'zh-CN'
      ? (row.classList.contains('active') ? '当前账号' : '点击切换')
      : (row.classList.contains('active') ? 'Current account' : 'Click to switch');
    copy.append(strong, small);

    const check = document.createElement('span');
    check.className = 'account-check';
    row.append(avatar, copy, check);
    row.addEventListener('click', () => switchAccount(account));
    list.appendChild(row);
  });
}

function setAccount(account) {
  state.activeAccount = account || null;
  const name = accountName(account);
  state.loggedIn = Boolean(name);

  $('#account-name').textContent = name || tr('notLoggedIn');
  $('#account-avatar').textContent = name ? '' : '+';
  applySkinAvatar($('#account-avatar'), account);
  $('#account-menu').classList.toggle('logged-in', Boolean(name));
  $('#logout').classList.toggle('hidden', !name);
  if ($('#settings-account')) $('#settings-account').textContent = name || '未登录';
  renderAccounts();
  syncLaunchState();
}

async function switchAccount(account) {
  if (!account || (state.activeAccount && accountId(account) === accountId(state.activeAccount))) {
    $('#account-menu').classList.remove('open');
    return;
  }

  try {
    setBusy(true);
    setStatus(`正在切换到 ${accountName(account)}…`, 'busy');

    if (hasApi('switchAccount')) {
      const result = await bridge.switchAccount(accountId(account));
      setAccount(result || account);
    } else if (hasApi('useAccount')) {
      const result = await bridge.useAccount(accountId(account));
      setAccount(result || account);
    } else if (hasApi('selectAccount')) {
      const result = await bridge.selectAccount(accountId(account));
      setAccount(result || account);
    } else {
      throw new Error('当前启动器后端没有提供账号切换接口');
    }

    setStatus(`已切换账号：${accountName(state.activeAccount)}`, 'success');
  } catch (error) {
    setStatus(`切换失败：${errorText(error)}`, 'error');
  } finally {
    setBusy(false);
    $('#account-menu').classList.remove('open');
  }
}

function settings() {
  return {
    version: state.version,
    memory: state.memory,
    javaPath: state.javaPath,
    language: state.language,
    preallocateMemory: state.preallocateMemory,
    resolutionWidth: state.resolutionWidth,
    resolutionHeight: state.resolutionHeight,
    fullscreen: state.fullscreen,
    jvmArgs: state.jvmArgs,
    intelPerformance: state.intelPerformance,
    onGameError: state.onGameError,
    onGameCrash: state.onGameCrash,
    onGameLaunch: state.onGameLaunch,
    onGameClose: state.onGameClose
    , gameDirectory: state.gameDirectory, downloadDirectory: state.downloadDirectory
  };
}

function queueSettingsSave() {
  clearTimeout(settingsSaveTimer);
  settingsSaveTimer = setTimeout(() => {
    callApi('saveSettings', settings()).catch((error) => {
      setStatus(`配置自动保存失败：${errorText(error)}`, 'error');
    });
  }, 250);
}

let homeExitTimer;
function showView(name) {
  const selected = document.querySelector(`#${name}-view`);
  if (!selected || selected.classList.contains('active')) return;
  const home = $('#home-view');
  if (name !== 'home' && home.classList.contains('active')) {
    home.classList.add('home-exit');
    clearTimeout(homeExitTimer);
    homeExitTimer = setTimeout(() => home.classList.remove('home-exit'), 420);
  } else if (name === 'home') {
    clearTimeout(homeExitTimer);
    home.classList.remove('home-exit');
  }
  // The background belongs to the non-home group, not to each individual tab.
  document.body.classList.toggle('secondary-pages', name !== 'home');
  const serversView = $('#servers-view');
  const settingsView = $('#settings-view');
  const aboutView = $('#about-view');
  home.classList.toggle('active', name === 'home');
  serversView.classList.toggle('active', name === 'servers');
  settingsView.classList.toggle('active', name === 'settings');
  aboutView.classList.toggle('active', name === 'about');
  $('#account-menu').classList.remove('open');
  $('#version-picker')?.classList.remove('open');
  $('#nav-home')?.classList.toggle('active', name === 'home');
  $('#nav-servers')?.classList.toggle('active', name === 'servers');
  $('#open-settings')?.classList.toggle('active', name === 'settings');
  $('#nav-about')?.classList.toggle('active', name === 'about');
  const target = document.querySelector(`#${name}-view`);
  if (target) {
    target.classList.remove('view-enter');
    void target.offsetWidth;
    target.classList.add('view-enter');
  }
  if (name === 'servers' && !state.serversLoaded) loadServers(true);
}

function syncAbout(info = {}) {
  const values = {
    '#about-version': info.version,
    '#about-footer-version': info.version ? `v${String(info.version).replace(/^v/i, '')}` : '',
    '#about-branch': info.branch,
    '#about-locale': info.locale,
    '#about-java': info.java,
    '#about-cpu': info.cpu,
    '#about-memory': info.memory,
    '#about-system': info.system,
  };
  Object.entries(values).forEach(([selector, value]) => {
    if ($(selector) && value) $(selector).textContent = value;
  });
}

function showCrashReport(report) {
  if (!report || !report.id) return;
  lastCrashReport = report;
  $('#crash-summary-title').textContent = report.summary || 'Game process exited unexpectedly';
  $('#crash-summary-meta').textContent = report.signal ? `Signal ${report.signal}` : `Exit code ${report.code ?? 'unknown'}`;
  $('#crash-summary-text').textContent = report.summary || 'Unexpected error';
  $('#crash-log-caption').textContent = tr('crashDetails');
  $('#crash-log').textContent = report.log || report.summary || '';
  $('#crash-id').textContent = report.id;
  $('#crash-time').textContent = new Date(report.timestamp || Date.now()).toLocaleString(state.language);
  $('#crash-overlay').classList.remove('hidden');
  $('#crash-log').scrollTop = 0;
}

function closeCrashReport() {
  $('#crash-overlay')?.classList.add('hidden');
}

function renderServers() {
  const grid = $('#server-grid');
  const empty = $('#servers-empty');
  if (!grid || !empty) return;
  grid.textContent = '';
  empty.classList.toggle('hidden', state.servers.length > 0);
  const onlineCount = state.servers.filter((server) => server.online).length;
  $('#online-server-count').textContent = String(onlineCount);

  for (const server of state.servers) {
    const card = document.createElement('article');
    card.className = `server-card${server.online ? ' online' : ''}${server.pinned ? ' pinned' : ''}`;

    const status = document.createElement('div');
    status.className = 'server-card-status';
    const dot = document.createElement('i');
    const statusText = document.createElement('span');
    statusText.textContent = server.online
      ? `${server.players?.online || 0} / ${server.players?.max || 0} ${tr('online')}`
      : (server.error || tr('waiting'));
    status.append(dot, statusText);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'server-remove';
    remove.title = '移除服务器';
    remove.textContent = '×';
    remove.addEventListener('click', async (event) => {
      event.stopPropagation();
      try {
        state.servers = await callApi('removeServer', server.address);
        renderServers();
      } catch (error) { setStatus(`移除服务器失败：${errorText(error)}`, 'error'); }
    });

    const body = document.createElement('div');
    body.className = 'server-card-body';
    const badge = document.createElement('div');
    badge.className = 'server-badge';
    if (server.pinned) {
      const logo = document.createElement('img');
      logo.src = '../assets/kazer-server-logo.png';
      logo.alt = '';
      badge.appendChild(logo);
    } else {
      badge.textContent = String(server.name || 'K').trim().slice(0, 1).toUpperCase();
    }
    const copy = document.createElement('div');
    const name = document.createElement('h2');
    name.textContent = server.name;
    const address = document.createElement('p');
    address.textContent = server.address;
    const detail = document.createElement('small');
    detail.textContent = server.online
      ? `${server.version || 'Minecraft'} · ${server.latency ?? 0} ms`
      : tr('offline');
    copy.append(name, address, detail);
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'server-play';
    play.title = '启动并进入服务器';
    play.textContent = '▷';
    play.disabled = state.busy || selectedAccountRunning() || !state.loggedIn || !state.javaPath;
    play.addEventListener('click', () => launchSelectedServer(server.address));
    body.append(badge, copy, play);
    card.append(status);
    if (!server.pinned) card.append(remove);
    card.append(body);
    grid.appendChild(card);
  }
}

async function loadServers(refresh = false) {
  try {
    state.servers = await callApi('listServers');
    state.serversLoaded = true;
    renderServers();
    if (refresh) await refreshServers();
  } catch (error) {
    setStatus(`读取服务器失败：${errorText(error)}`, 'error');
  }
}

async function refreshServers() {
  if (state.serversRefreshing) return;
  state.serversRefreshing = true;
  $('#refresh-servers')?.classList.add('is-refreshing');
  $('#server-refresh-label').textContent = tr('refreshingServers');
  try {
    state.servers = await callApi('refreshServers');
    renderServers();
    $('#server-refresh-label').textContent = `${tr('refreshedServers')} · ${state.servers.filter((server) => server.online).length} ${tr('online')}`;
  } catch (error) {
    $('#server-refresh-label').textContent = tr('refreshFailed');
    setStatus(`服务器刷新失败：${errorText(error)}`, 'error');
  } finally {
    state.serversRefreshing = false;
    $('#refresh-servers')?.classList.remove('is-refreshing');
  }
}

async function launchSelectedServer(address) {
  if (state.busy || selectedAccountRunning()) return;
  setBusy(true);
  renderServers();
  setStatus(`正在准备进入 ${address}…`, 'busy');
  try {
    const launched = await callApi('launch', { ...settings(), server: address });
    if (launched?.accountId && !state.busyAccountIds.includes(launched.accountId)) state.busyAccountIds.push(launched.accountId);
    setBusy(false);
    setStatus(`游戏已启动（PID ${launched?.pid || '未知'}）。`, 'success');
  } catch (error) {
    setStatus(`启动失败：${errorText(error)}`, 'error');
    setBusy(false);
    renderServers();
  }
}

function setVersion(version) {
  state.version = version;
  $('#version-label').textContent = version;
  if ($('#settings-version')) $('#settings-version').textContent = version;
  document.querySelectorAll('.version-option').forEach((item) => {
    item.classList.toggle('selected', item.dataset.version === version);
  });
  syncLaunchState();
}

async function login() {
  if (!state.authConfigured) {
    setStatus('微软登录未配置：请将你自己的 Client ID 写入官方 .minecraft\\kazer-client-id.txt 后重试。', 'error');
    return;
  }

  setBusy(true);
  setStatus('正在等待微软登录…', 'busy');
  try {
    const profile = await callApi('login');
    const normalized = profile && profile.name && !profile.username
      ? { ...profile, username: profile.name }
      : profile;

    if (normalized && accountName(normalized)) {
      upsertAccount(normalized);
      setAccount(normalized);
    }

    setStatus('登录成功，账号已准备就绪。', 'success');
  } catch (error) {
    setStatus(`登录失败：${errorText(error)}`, 'error');
  } finally {
    setBusy(false);
    $('#account-menu').classList.remove('open');
  }
}

function syncSettingsControls(initial = {}) {
  $('#memory-range').value = String(state.memory || 4096);
  $('#memory-value').textContent = String(Math.round((state.memory || 4096) / 1024));
  syncMemoryRangeVisual();
  $('#preallocate-memory').checked = Boolean(state.preallocateMemory);
  $('#resolution-width').value = String(state.resolutionWidth || 854);
  $('#resolution-height').value = String(state.resolutionHeight || 480);
  $('#fullscreen').checked = Boolean(state.fullscreen);
  $('#jvm-args').value = state.jvmArgs || '';
  $('#intel-performance').checked = state.intelPerformance !== false;
  $('#on-game-error').value = state.onGameError || 'ignore';
  $('#on-game-crash').value = state.onGameCrash || 'prompt';
  for (const kind of ['game', 'download']) {
    const key = `${kind}Directory`;
    if (initial[key]) state[key] = initial[key];
    if ($(`#${kind}-directory`)) $(`#${kind}-directory`).value = state[key] || '';
  }
  document.querySelectorAll('.segmented').forEach((group) => {
    const selected = state[group.dataset.setting];
    group.querySelectorAll('button').forEach((button) => button.classList.toggle('active', button.dataset.value === selected));
  });
  applyLanguage(state.language);
  syncJavaVisual();
}

function syncMemoryRangeVisual() {
  const range = $('#memory-range');
  if (!range) return;
  const min = Number(range.min) || 0;
  const max = Number(range.max) || 1;
  const progress = ((Number(range.value) - min) / Math.max(1, max - min)) * 100;
  range.style.setProperty('--range-progress', `${Math.max(0, Math.min(100, progress))}%`);
}

async function init() {
  if (!bridge) {
    setStatus('启动器接口没有注入，请从 KazerLauncher.exe 打开。', 'error');
    document.body.classList.add('ready');
    return;
  }

  try {
    const initial = await callApi('getState');
    if (initial && initial.settings) Object.assign(state, initial.settings);
    const launcherVersion = String(initial?.launcherVersion || '0.1.0').replace(/^v/i, '');
    applyReleaseNews(initial.releaseNews);
    const launcherDate = $('#launcher-release-date');
    if (launcherDate && /^\d{4}-\d{2}-\d{2}$/.test(initial.launcherRelease?.date || '')) {
      launcherDate.dateTime = initial.launcherRelease.date;
      launcherDate.textContent = initial.launcherRelease.date.split('-').map(Number).join('.');
    }
    syncAbout(initial?.about || { version: launcherVersion });
    state.authConfigured = !initial || initial.authConfigured !== false;
    state.busyAccountIds = initial.busyAccountIds || [];
    state.accounts = [];
    for (const account of Array.isArray(initial && initial.accounts) ? initial.accounts : []) upsertAccount(account);

    setVersion(state.version === '1.8.9' ? '1.8.9' : '1.7.10');
    syncSettingsControls(initial || {});

    const current = state.accounts[0] || null;
    setAccount(current);

    if (!state.authConfigured) {
      setStatus('微软登录未配置：请将自己的 Client ID 写入官方 .minecraft\\kazer-client-id.txt。', 'error');
    } else if (initial && initial.encryptionAvailable === false) {
      setStatus('系统安全存储不可用，账号保存已禁用。', 'error');
    } else if (!state.javaPath) {
      setStatus(tr('noJava'), 'neutral');
    } else if (!state.loggedIn) {
      setStatus(tr('clickLogin'), 'neutral');
    } else {
      setStatus(tr('launcherReady'), 'success');
    }
  } catch (error) {
    setStatus(`初始化失败：${errorText(error)}`, 'error');
  } finally {
    window.setTimeout(() => document.body.classList.add('ready'), 180);
  }
}

$('#open-settings').addEventListener('click', () => showView('settings'));
$('#session-settings').addEventListener('click', () => showView('settings'));
$('#nav-home').addEventListener('click', () => showView('home'));
$('#nav-logo').addEventListener('click', () => showView('home'));
$('#nav-servers').addEventListener('click', () => showView('servers'));
$('#nav-about').addEventListener('click', () => showView('about'));
for (const kind of ['game', 'download']) {
  const input = $(`#${kind}-directory`);
  const saveDirectory = async (value) => {
    if (!value.trim()) return syncSettingsControls();
    state[`${kind}Directory`] = value.trim();
    try {
      const saved = await callApi('saveSettings', settings());
      Object.assign(state, saved); syncSettingsControls();
    } catch (error) { setStatus(errorText(error), 'error'); }
  };
  input.addEventListener('change', () => saveDirectory(input.value));
  $(`[data-choose-directory="${kind}"]`).addEventListener('click', async () => {
    try { const value = await callApi('chooseDirectory', kind); if (value) await saveDirectory(value); }
    catch (error) { setStatus(errorText(error), 'error'); }
  });
}

document.querySelectorAll('[data-external]').forEach((button) => {
  button.addEventListener('click', () => callApi('openExternal', button.dataset.external).catch((error) => setStatus(errorText(error), 'error')));
});

document.querySelectorAll('[data-log-target]').forEach((button) => {
  button.addEventListener('click', () => callApi('openLogs', button.dataset.logTarget).catch((error) => setStatus(errorText(error), 'error')));
});

$('#join-qq').addEventListener('click', async () => {
  const button = $('#join-qq');
  try {
    const result = await callApi('joinQqGroup');
    button.lastElementChild.textContent = state.language === 'zh-CN' ? `群号 ${result.group} 已复制` : `Copied ${result.group}`;
  } catch (error) {
    button.lastElementChild.textContent = errorText(error);
  } finally {
    window.setTimeout(() => { button.lastElementChild.textContent = tr('joinQq'); }, 2400);
  }
});

function openAccountMenu(open) {
  $('#account-menu').classList.toggle('open', open);
  $('#account-trigger').setAttribute('aria-expanded', String(open));
}
$('#account-menu').addEventListener('pointerenter', () => openAccountMenu(true));
$('#account-menu').addEventListener('pointerleave', (event) => {
  if (!$('#account-menu').contains(event.relatedTarget)) openAccountMenu(false);
});
$('#account-menu').addEventListener('focusin', () => openAccountMenu(true));
$('#account-menu').addEventListener('focusout', (event) => {
  if (!$('#account-menu').contains(event.relatedTarget)) openAccountMenu(false);
});
$('#account-trigger').addEventListener('click', (event) => {
  event.stopPropagation();
  openAccountMenu(true);
});

$('#add-account').addEventListener('click', login);

$('#logout').addEventListener('click', async () => {
  try {
    setBusy(true);
    await callApi('logout');
    const oldId = accountId(state.activeAccount);
    state.accounts = state.accounts.filter((item) => accountId(item) !== oldId);
    setAccount(state.accounts[0] || null);
    setStatus(state.loggedIn ? '当前账号已移除，已切换到下一个账号。' : '账号已从本机移除。', 'success');
  } catch (error) {
    setStatus(`退出失败：${errorText(error)}`, 'error');
  } finally {
    setBusy(false);
    $('#account-menu').classList.remove('open');
  }
});

$('#version-trigger').addEventListener('click', (event) => {
  event.stopPropagation();
  const picker = $('#version-picker');
  const open = !picker.classList.contains('open');
  picker.classList.toggle('open', open);
  $('#version-trigger').setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.version-option').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.disabled) return;
    setVersion(button.dataset.version);
    queueSettingsSave();
    $('#version-picker').classList.remove('open');
  });
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('#account-menu')) $('#account-menu').classList.remove('open');
  if (!event.target.closest('#version-picker')) $('#version-picker').classList.remove('open');
});

// The launcher is a button-driven UI; prevent accidental text selection and
// browser context menus.
document.addEventListener('selectstart', (event) => {
  if (!event.target.closest('#crash-log')) event.preventDefault();
});
document.addEventListener('contextmenu', (event) => event.preventDefault());

$('#memory-range').addEventListener('input', (event) => {
  state.memory = Number(event.target.value);
  $('#memory-value').textContent = String(Math.round(state.memory / 1024));
  syncMemoryRangeVisual();
  queueSettingsSave();
});

const settingBindings = [
  ['#preallocate-memory', 'preallocateMemory', 'checked'],
  ['#resolution-width', 'resolutionWidth', 'number'],
  ['#resolution-height', 'resolutionHeight', 'number'],
  ['#fullscreen', 'fullscreen', 'checked'],
  ['#jvm-args', 'jvmArgs', 'value'],
  ['#intel-performance', 'intelPerformance', 'checked'],
  ['#on-game-error', 'onGameError', 'value'],
  ['#on-game-crash', 'onGameCrash', 'value'],
];
for (const [selector, property, kind] of settingBindings) {
  $(selector)?.addEventListener('change', (event) => {
    state[property] = kind === 'checked' ? event.target.checked : kind === 'number' ? Number(event.target.value) : event.target.value;
    queueSettingsSave();
  });
}

$('#language-select').addEventListener('change', (event) => {
  applyLanguage(event.target.value);
  setStatus(tr('launcherReady'), 'success');
  queueSettingsSave();
});
function closeLanguageMenu() {
  $('#language-menu').hidden = true;
  $('#language-trigger').setAttribute('aria-expanded', 'false');
}
$('#language-trigger').addEventListener('click', () => {
  const open = $('#language-menu').hidden;
  $('#language-menu').hidden = !open;
  $('#language-trigger').setAttribute('aria-expanded', String(open));
  if (open) $('#language-menu button[aria-selected="true"]')?.focus();
});
document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {
  $('#language-select').value = button.dataset.language;
  $('#language-select').dispatchEvent(new Event('change'));
  closeLanguageMenu(); $('#language-trigger').focus();
}));
document.addEventListener('click', event => { if (!event.target.closest('.language-picker')) closeLanguageMenu(); });
$('#language-menu').addEventListener('keydown', event => {
  if (event.key === 'Escape') { closeLanguageMenu(); $('#language-trigger').focus(); }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const buttons = [...$('#language-menu').querySelectorAll('button')];
    const i = buttons.indexOf(document.activeElement);
    buttons[(i + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length].focus();
  }
});

$('#show-advanced').addEventListener('change', (event) => {
  $('#settings-view').classList.toggle('show-advanced', event.target.checked);
});

document.querySelectorAll('.settings-tab').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.settings-tab').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll('.settings-panel').forEach((panel) => panel.classList.toggle('active', panel.dataset.settingsPanel === button.dataset.settingsTab));
  });
});

document.querySelectorAll('.segmented').forEach((group) => {
  group.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      state[group.dataset.setting] = button.dataset.value;
      group.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button));
      queueSettingsSave();
    });
  });
});

$('#reset-launcher-settings').addEventListener('click', async () => {
  try {
    const reset = await callApi('resetSettings');
    Object.assign(state, reset);
    syncSettingsControls();
    syncLaunchState();
    setStatus(state.language === 'zh-CN' ? '启动器设置已重置。' : 'Launcher settings were reset.', 'success');
  } catch (error) { setStatus(`重置失败：${errorText(error)}`, 'error'); }
});

$('#open-game-directory').addEventListener('click', () => callApi('openGameDirectory').catch((error) => setStatus(errorText(error), 'error')));

$('#choose-java').addEventListener('click', async () => {
  try {
    const selected = await callApi('chooseJava');
    if (selected) {
      state.javaPath = selected;
      syncJavaVisual();
      setStatus(`已选择 Java：${selected}`, 'success');
      syncLaunchState();
      queueSettingsSave();
    }
  } catch (error) {
    setStatus(`选择 Java 失败：${errorText(error)}`, 'error');
  }
});

$('#detect-java').addEventListener('click', async () => {
  const button = $('#detect-java');
  button.classList.add('is-detecting');
  button.disabled = true;
  setStatus('正在查找电脑上的 Java…', 'busy');

  try {
    const detected = await callApi('autoDetectJava');
    if (detected) {
      state.javaPath = detected;
      syncJavaVisual();
      setStatus(`已找到 Java：${detected}`, 'success');
      syncLaunchState();
      queueSettingsSave();
    } else {
      setStatus('没有找到 Java，将在启动时尝试使用内置 Java 8。', 'neutral');
    }
  } catch (error) {
    setStatus(`Java 检测失败：${errorText(error)}`, 'error');
  } finally {
    button.classList.remove('is-detecting');
    button.disabled = false;
    showNotice(tr('updateDownloadFailed'), errorText(error), 'error');
  }
});

$('#launch').addEventListener('click', async () => {
  if (state.busy || selectedAccountRunning()) return;
  setBusy(true);
  setStatus('正在准备 Kazer Client…', 'busy');
  try {
    const launched = await callApi('launch', settings());
    if (launched?.accountId && !state.busyAccountIds.includes(launched.accountId)) state.busyAccountIds.push(launched.accountId);
    setBusy(false);
    setStatus(`游戏已启动（PID ${launched && launched.pid ? launched.pid : '未知'}）。`, 'success');
  } catch (error) {
    setStatus(`启动失败：${errorText(error)}`, 'error');
    setBusy(false);
  }
});

if (hasApi('onRunningAccounts')) bridge.onRunningAccounts((ids) => {
  state.busyAccountIds = Array.isArray(ids) ? ids : [];
  syncLaunchState();
  renderServers();
});
window.setInterval(async () => {
  if (!hasApi('runningAccounts')) return;
  try { state.busyAccountIds = await bridge.runningAccounts(); syncLaunchState(); } catch { /* IPC unavailable while closing. */ }
}, 5000);

const windowActions = {
  '#window-minimize': 'minimizeWindow',
  '#window-close': 'closeWindow'
};
Object.entries(windowActions).forEach(([selector, apiName]) => {
  $(selector).addEventListener('click', () => {
    if (hasApi(apiName)) bridge[apiName]();
  });
});

const titlebar = $('.titlebar');
let titlebarDragPointer;
titlebar.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || event.target.closest('.window-controls, button, .account-menu')) return;
  titlebarDragPointer = event.pointerId;
  titlebar.setPointerCapture(event.pointerId);
  bridge?.startWindowDrag?.({ x: event.screenX, y: event.screenY });
});
titlebar.addEventListener('pointermove', (event) => {
  if (event.pointerId !== titlebarDragPointer) return;
  bridge?.moveWindowDrag?.({ x: event.screenX, y: event.screenY });
});
const endTitlebarDrag = (event) => {
  if (event.pointerId !== titlebarDragPointer) return;
  titlebarDragPointer = undefined;
  bridge?.endWindowDrag?.();
};
titlebar.addEventListener('pointerup', endTitlebarDrag);
titlebar.addEventListener('pointercancel', endTitlebarDrag);

if (hasApi('onAuthComplete')) {
  bridge.onAuthComplete((account) => {
    if (!account) return;
    const normalized = account.name && !account.username ? { ...account, username: account.name } : account;
    upsertAccount(normalized);
    setAccount(normalized);
    setStatus(`欢迎回来，${accountName(normalized)}。`, 'success');
    setBusy(false);
  });
}

if (hasApi('onStatus')) {
  bridge.onStatus((message) => {
    setStatus(message);
    if (String(message).includes('已退出') || String(message).startsWith('错误') || String(message).includes('失败')) setBusy(false);
  });
}

if (hasApi('onLog')) {
  bridge.onLog((message) => {
    const log = $('#log');
    if (!log) return;
    log.textContent = `${log.textContent}\n${message}`.trim().split('\n').slice(-80).join('\n');
    log.scrollTop = log.scrollHeight;
  });
}

if (hasApi('onGameCrashed')) {
  bridge.onGameCrashed(showCrashReport);
}

$('#crash-close')?.addEventListener('click', closeCrashReport);
$('#crash-overlay')?.addEventListener('click', (event) => {
  if (event.target === $('#crash-overlay')) closeCrashReport();
});
$('#crash-copy')?.addEventListener('click', async () => {
  if (!lastCrashReport) return;
  try {
    await callApi('copyText', lastCrashReport.id);
    $('#crash-copy').textContent = state.language === 'zh-CN' ? '已复制' : 'Copied';
    window.setTimeout(() => { $('#crash-copy').textContent = tr('copy'); }, 1400);
  } catch (error) {
    $('#crash-log').textContent = errorText(error);
  }
});
$('#crash-open-logs')?.addEventListener('click', () => callApi('openLogs', 'folder').catch((error) => {
  $('#crash-log').textContent = errorText(error);
}));
$('#crash-diagnostics')?.addEventListener('click', async () => {
  if (!lastCrashReport) return;
  try {
    $('#crash-log-caption').textContent = tr('diagnostics');
    $('#crash-log').textContent = await callApi('runCrashDiagnostics', lastCrashReport.id);
  } catch (error) {
    $('#crash-log').textContent = errorText(error);
  }
});
$('#crash-log-viewer')?.addEventListener('click', () => {
  if (!lastCrashReport) return;
  $('#crash-log-caption').textContent = tr('crashDetails');
  $('#crash-log').textContent = lastCrashReport.log || lastCrashReport.summary || '';
  $('#crash-log').scrollTop = 0;
});

if (hasApi('onShowSettings')) {
  bridge.onShowSettings(() => showView('settings'));
}

if (hasApi('onShowServers')) {
  bridge.onShowServers(() => showView('servers'));
}

$('#update-dismiss')?.addEventListener('click', () => {
  $('#update-toast')?.classList.add('hidden');
});

$('#update-now')?.addEventListener('click', async () => {
  const button = $('#update-now');
  updateDownloadRequested = true;
  button.disabled = true;
  $('#update-toast')?.classList.add('hidden');
  showView('home');
  showUpdateProgress();
  $('#update-progress-label').textContent = tr('updateDownloading');
  try {
    const started = await callApi('downloadUpdate');
    if (!started) throw new Error(tr('updateDownloadFailed'));
  } catch (error) {
    const progress = $('#update-progress');
    progress?.classList.add('error');
    $('#update-progress-label').textContent = tr('updateDownloadFailed');
    $('#update-progress-meta').textContent = errorText(error);
    button.disabled = false;
  }
});

if (hasApi('onUpdateAvailable')) {
  bridge.onUpdateAvailable((info) => showUpdateToast(info));
}

if (hasApi('onUpdateProgress')) {
  bridge.onUpdateProgress((progress) => renderUpdateProgress(progress));
}

if (hasApi('onUpdateDownloaded')) {
  bridge.onUpdateDownloaded((info) => {
    showUpdateProgress();
    $('#update-progress')?.classList.add('complete');
    $('#update-progress-bar').style.width = '100%';
    $('#update-progress-percent').textContent = '100%';
    $('#update-progress-label').textContent = info?.waitingForGame ? tr('updateWaitingForGame') : tr('updateInstalling');
  });
}

if (hasApi('onUpdateError')) {
  bridge.onUpdateError((error) => {
    if (!updateDownloadRequested) return;
    const progress = $('#update-progress');
    showUpdateProgress();
    progress?.classList.add('error');
    $('#update-progress-label').textContent = tr('updateDownloadFailed');
    $('#update-progress-meta').textContent = errorText(error?.message || error);
    $('#update-now').disabled = false;
    showNotice(tr('updateDownloadFailed'), errorText(error?.message || error), 'error');
  });
}

serverRefreshTimer = window.setInterval(() => {
  if ($('#servers-view')?.classList.contains('active') && state.servers.length) refreshServers();
}, 30000);

window.setTimeout(() => document.body.classList.add('ready'), 8000);
init();
