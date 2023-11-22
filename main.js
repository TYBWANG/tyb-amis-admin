import 'amis/lib/themes/default.css';
import 'amis/lib/helper.css';
import '@fortawesome/fontawesome-free/css/all.css'
import '/style.css'

import { createBrowserHistory } from 'history';
import 'amis/sdk/sdk.js';
import 'amis/sdk/charts.js'
import '/src/components'


const amis = amisRequire('amis/embed');
const history = createBrowserHistory();
const match = amisRequire('path-to-regexp').match;

let userInfo = {}

const app = {
    type: 'app',
    brandName: 'amis-demo',
    data: {
        origin: location.origin,
        baseURL: import.meta.env.VITE_BASE_URL
    },
    header: { "type": "header-right" },
    api: '/setting/menu.json'
};

function normalizeLink(to, location = history.location) {
    to = to || '';

    if (to && to[0] === '#') {
        to = location.pathname + location.search + to;
    } else if (to && to[0] === '?') {
        to = location.pathname + to;
    }

    const idx = to.indexOf('?');
    const idx2 = to.indexOf('#');
    let pathname = ~idx
        ? to.substring(0, idx)
        : ~idx2
            ? to.substring(0, idx2)
            : to;
    let search = ~idx ? to.substring(idx, ~idx2 ? idx2 : undefined) : '';
    let hash = ~idx2 ? to.substring(idx2) : location.hash;

    if (!pathname) {
        pathname = location.pathname;
    } else if (pathname[0] != '/' && !/^https?\:\/\//.test(pathname)) {
        let relativeBase = location.pathname;
        const paths = relativeBase.split('/');
        paths.pop();
        let m;
        while ((m = /^\.\.?\//.exec(pathname))) {
            if (m[0] === '../') {
                paths.pop();
            }
            pathname = pathname.substring(m[0].length);
        }
        pathname = paths.concat(pathname).join('/');
    }

    return pathname + search + hash;
}


function isCurrentUrl(to, ctx) {
    if (!to) {
        return false;
    }
    const pathname = history.location.pathname;
    const link = normalizeLink(to, {
        ...location,
        pathname,
        hash: ''
    });

    if (!~link.indexOf('http') && ~link.indexOf(':')) {
        let strict = ctx && ctx.strict;
        return match(link, {
            decode: decodeURIComponent,
            strict: typeof strict !== 'undefined' ? strict : true
        })(pathname);
    }

    return decodeURI(pathname) === link;
}

init4App()


function init4App() {
    // 模拟登录后写入
    localStorage.setItem('userInfo', JSON.stringify({username: 'test'}))

    let temp = localStorage.getItem('userInfo')
    if (temp) {
        userInfo = JSON.parse(temp)
        app.data = { ...app.data, userInfo }
    }
    let amisInstance = amis.embed(
        '#app',
        app,
        {
            location: history.location
        },
        {
            requestAdaptor(api) {
                if (api.url.slice(0, 4) !== 'http' && api.url.split('?')[0].slice(-5) !== '.json') {
                    const token = localStorage.getItem('token')
                    if (token) {
                        api.headers['X-Access-Token'] = token
                    }
                    api.url = import.meta.env.VITE_BASE_URL + api.url
                    api.perPageField = 'pageSize'
                    if (api.url.includes('download')) {
                        api.headers['accept'] = '*/*'
                        api.headers['Content-Type'] = 'application/json'

                    }
                }

                return api;
            },
            responseAdaptor(api, payload, query, request, response) {
                payload.msg = payload.message
                if (response.data.code !== 200) {
                    response.status = response.data.code
                }

                if (api.url.slice(0, 4) !== 'http' && api.url.split('?')[0].slice(-5) !== '.json') {
                    payload.data = payload.result
                    if (api.url.includes('pageSize') || api.url.includes('size')) {
                        payload.data = {
                            items: payload.result.records,
                            page: payload.result.current,
                            total: payload.result.total
                        }
                    }
                    if (api.url.includes('dropOnlineProductByGov')) {
                        payload.data = {
                            items: payload.data
                        }
                    }
                    if (payload.data && payload.data.records) {
                        payload.data.items = payload.data.records
                    }
                }

                return payload;
            },
            // watchRouteChange: fn => {
            //   return history.listen(fn);
            // },
            updateLocation: (location, replace) => {
                location = normalizeLink(location);
                if (location === 'goBack') {
                    return history.goBack();
                } else if (
                    (!/^https?\:\/\//.test(location) &&
                        location ===
                        history.location.pathname + history.location.search) ||
                    location === history.location.href
                ) {
                    // 目标地址和当前地址一样，不处理，免得重复刷新
                    return;
                } else if (/^https?\:\/\//.test(location) || !history) {
                    return (window.location.href = location);
                }

                history[replace ? 'replace' : 'push'](location);
            },
            jumpTo: (to, action) => {
                if (to === 'goBack') {
                    return history.goBack();
                }

                to = normalizeLink(to);

                if (isCurrentUrl(to)) {
                    return;
                }

                if (action && action.actionType === 'url') {
                    action.blank === false
                        ? (window.location.href = to)
                        : window.open(to, '_blank');
                    return;
                } else if (action && action.blank) {
                    window.open(to, '_blank');
                    return;
                }

                if (/^https?:\/\//.test(to)) {
                    window.location.href = to;
                } else if (
                    (!/^https?\:\/\//.test(to) &&
                        to === history.pathname + history.location.search) ||
                    to === history.location.href
                ) {
                    // do nothing
                } else {
                    history.push(to);
                }
            },
            isCurrentUrl: isCurrentUrl,
            theme: 'cxd'
        }
    );

    history.listen(state => {
        amisInstance.updateProps({
            location: state.location || state
        });
    });
    history.replace('/demo');
}


