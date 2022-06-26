"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
function useMediaQueries(queriesByFriendlyNames) {
    const initialQueriesMatches = {};
    for (const friendlyName in queriesByFriendlyNames) {
        const query = queriesByFriendlyNames[friendlyName];
        initialQueriesMatches[friendlyName] = initialQueriesMatches[friendlyName] || false;
        initialQueriesMatches[query] = initialQueriesMatches[query] || false;
    }
    const queryLists = {};
    const [staleQueriesMatches, queueUpdateQueriesMatches] = (0, react_1.useState)(initialQueriesMatches);
    (0, react_1.useEffect)(onceAfterFirstRender, []);
    function onceAfterFirstRender() {
        var _a;
        loadQueryListsFromWindow(queryLists, queriesByFriendlyNames);
        const updatedQueriesMatches = {};
        for (const friendlyName in queriesByFriendlyNames) {
            const query = queriesByFriendlyNames[friendlyName];
            updatedQueriesMatches[query] = (_a = queryLists[query]) === null || _a === void 0 ? void 0 : _a.matches;
        }
        ;
        syncFriendlyNamesWithQueries(updatedQueriesMatches, queriesByFriendlyNames);
        queueUpdateQueriesMatches(updatedQueriesMatches);
        const listenerReferencesByQuery = addListenersAndGetTheirReferences(staleQueriesMatches, queryLists, queriesByFriendlyNames, queueUpdateQueriesMatches);
        function cleanup() {
            for (const query in listenerReferencesByQuery) {
                queryLists[query].removeEventListener('change', listenerReferencesByQuery[query]);
            }
        }
        return cleanup;
    }
    const proxy = getQueriesProxy(staleQueriesMatches, queriesByFriendlyNames);
    return proxy;
}
exports.default = useMediaQueries;
function loadQueryListsFromWindow(queryLists, queryInputs) {
    for (const friendlyName in queryInputs) {
        const query = queryInputs[friendlyName];
        queryLists[query] = window.matchMedia(query);
        queryLists[friendlyName] = queryLists[query];
    }
}
function addListenersAndGetTheirReferences(queriesMatches, queryLists, queryInputs, queueUpdateQueriesMatches) {
    const listenersByQuery = {};
    for (const queryList in queryLists) {
        const listener = (event) => {
            const currentList = event.target;
            queueUpdateQueriesMatches(currentMatches => {
                const updated = Object.assign({}, currentMatches);
                updated[queryList] = currentList.matches;
                syncFriendlyNamesWithQueries(updated, queryInputs);
                return updated;
            });
            queriesMatches[queryList] = currentList.matches;
        };
        queryLists[queryList].addEventListener('change', listener);
        listenersByQuery[queryList] = listener;
    }
    return listenersByQuery;
}
function syncFriendlyNamesWithQueries(queries, queryInputs) {
    for (const key in queryInputs) {
        queries[key] = queries[queryInputs[key]];
    }
}
function getQueriesProxy(queries, queryInputs) {
    return new Proxy(queries, {
        get(target, key) {
            if (target[key] === undefined) {
                console.warn(`You attempted to access the media query '${key}' but you didn't pass it into your useMediaQueries() function call. You passed in:`, queryInputs);
            }
            return target[key];
        }
    });
}
