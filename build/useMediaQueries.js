"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
if (typeof window !== "undefined") {
    window.cachedMediaQueries = window.cachedMediaQueries || {};
}
function useMediaQueries(queriesByFriendlyNames) {
    const initialQueryMatches = getInitialQueryMatches(queriesByFriendlyNames);
    const [queryMatches, queueSetQueryMatches] = (0, react_1.useState)(initialQueryMatches);
    const queryLists = {};
    (0, react_1.useEffect)(onceAfterFirstRender, []);
    function onceAfterFirstRender() {
        loadQueryListsFromWindow(queryLists, queriesByFriendlyNames);
        const updatedQueryMatches = getUpdatedQueryMatches(queriesByFriendlyNames, queryLists);
        syncFriendlyNamesWithQueries(updatedQueryMatches, queriesByFriendlyNames);
        queueSetQueryMatches(updatedQueryMatches);
        const listenerReferencesByQuery = addListenersAndGetTheirReferences(queryLists, queriesByFriendlyNames, queueSetQueryMatches);
        function cleanup() {
            for (const query in listenerReferencesByQuery) {
                queryLists[query].removeEventListener('change', listenerReferencesByQuery[query]);
            }
        }
        return cleanup;
    }
    const proxy = getQueriesProxy(queryMatches, queriesByFriendlyNames);
    return proxy;
}
exports.default = useMediaQueries;
function getInitialQueryMatches(queriesByFriendlyNames) {
    const initialQueryMatches = {};
    for (const friendlyName in queriesByFriendlyNames) {
        const query = queriesByFriendlyNames[friendlyName];
        initialQueryMatches[friendlyName] = false;
        initialQueryMatches[query] = false;
    }
    return initialQueryMatches;
}
function loadQueryListsFromWindow(queryLists, queriesByFriendlyNames) {
    for (const friendlyName in queriesByFriendlyNames) {
        const query = queriesByFriendlyNames[friendlyName];
        if (!window.cachedMediaQueries[query]) {
            window.cachedMediaQueries[query] = window.matchMedia(query);
        }
        const queryList = window.cachedMediaQueries[query];
        window.cachedMediaQueries[query] = queryList;
        queryLists[query] = queryList;
    }
}
function getUpdatedQueryMatches(queriesByFriendlyNames, queryLists) {
    var _a;
    const updatedQueryMatches = {};
    for (const friendlyName in queriesByFriendlyNames) {
        const query = queriesByFriendlyNames[friendlyName];
        updatedQueryMatches[query] = (_a = queryLists[query]) === null || _a === void 0 ? void 0 : _a.matches;
    }
    ;
    return updatedQueryMatches;
}
function addListenersAndGetTheirReferences(queryLists, queryInputs, queueUpdateQueriesMatches) {
    const listenersByQuery = {};
    for (const query in queryLists) {
        const listener = (event) => {
            const currentList = event.target;
            queueUpdateQueriesMatches(currentMatches => {
                return queriesMatchesUpdater(currentMatches, query, currentList.matches, queryInputs);
            });
        };
        queryLists[query].addEventListener('change', listener);
        listenersByQuery[query] = listener;
    }
    return listenersByQuery;
}
function queriesMatchesUpdater(currentMatches, query, matches, queryInputs) {
    const noActualChange = currentMatches[query] === matches;
    if (noActualChange) {
        return currentMatches;
    }
    ;
    const updated = Object.assign({}, currentMatches);
    updated[query] = matches;
    syncFriendlyNamesWithQueries(updated, queryInputs);
    return updated;
}
function syncFriendlyNamesWithQueries(queriesMatches, queryInputs) {
    for (const friendlyName in queryInputs) {
        queriesMatches[friendlyName] = queriesMatches[queryInputs[friendlyName]];
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
