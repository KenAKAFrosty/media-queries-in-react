import { useEffect, useState, Dispatch, SetStateAction } from "react";

interface CustomWindow extends Window {
    cachedMediaQueries: QueryLists,
}
declare let window: CustomWindow;

export type StringToString = { [key: string]: string }
export type QueryLists = { [key: string]: MediaQueryList }
export type QueryMatches = { [key: string]: boolean }

if (typeof window !== "undefined") {
    window.cachedMediaQueries = window.cachedMediaQueries || {};
}

export default function useMediaQueries<T extends StringToString>(
    queriesByFriendlyNames: T
): { [Property in keyof T]: boolean } {
    const initialQueryMatches = getInitialQueryMatches(queriesByFriendlyNames);
    const [queryMatches, queueSetQueryMatches] = useState<QueryMatches>(initialQueryMatches);
    const queryLists: QueryLists = {};


    useEffect(onceAfterFirstRender, [])
    function onceAfterFirstRender() {
        loadQueryListsFromWindow(queryLists, queriesByFriendlyNames);
        const updatedQueryMatches = getUpdatedQueryMatches(queriesByFriendlyNames, queryLists)
        syncFriendlyNamesWithQueries(updatedQueryMatches, queriesByFriendlyNames)
        queueSetQueryMatches(updatedQueryMatches);
        const listenerReferencesByQuery = addListenersAndGetTheirReferences(
            queryLists,
            queriesByFriendlyNames,
            queueSetQueryMatches
        )

        function cleanup() {
            for (const query in listenerReferencesByQuery) {
                queryLists[query].removeEventListener('change', listenerReferencesByQuery[query])
            }
        }
        return cleanup
    }

    const proxy = getQueriesProxy(queryMatches, queriesByFriendlyNames);
    return proxy as { [Property in keyof T]: boolean };
}

function getInitialQueryMatches(queriesByFriendlyNames: StringToString): QueryMatches {
    const initialQueryMatches: QueryMatches = {};
    for (const friendlyName in queriesByFriendlyNames) {
        const query = queriesByFriendlyNames[friendlyName];
        initialQueryMatches[friendlyName] = false;
        initialQueryMatches[query] = false;
    }
    return initialQueryMatches
}


function loadQueryListsFromWindow(queryLists: QueryLists, queriesByFriendlyNames: StringToString) {
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

function getUpdatedQueryMatches(queriesByFriendlyNames: StringToString, queryLists: QueryLists) {
    const updatedQueryMatches: QueryMatches = {}
    for (const friendlyName in queriesByFriendlyNames) {
        const query = queriesByFriendlyNames[friendlyName]
        updatedQueryMatches[query] = queryLists[query]?.matches;
    };
    return updatedQueryMatches
}

function addListenersAndGetTheirReferences(
    queryLists: QueryLists,
    queryInputs: StringToString,
    queueUpdateQueriesMatches: Dispatch<SetStateAction<{ [key: string]: boolean }>>
) {

    const listenersByQuery: { [key: string]: any } = {};
    for (const query in queryLists) {
        const listener = (event: MediaQueryListEvent) => {
            const currentList = event.target as MediaQueryList;
            queueUpdateQueriesMatches(currentMatches => {
                return queriesMatchesUpdater(currentMatches, query, currentList.matches, queryInputs)
            })
        }
        queryLists[query].addEventListener('change', listener);
        listenersByQuery[query] = listener;
    }
    return listenersByQuery
}

function queriesMatchesUpdater(
    currentMatches: QueryMatches,
    query: string,
    matches: boolean,
    queryInputs: StringToString,
) {
    const noActualChange = currentMatches[query] === matches
    if (noActualChange) { return currentMatches };

    const updated = { ...currentMatches };
    updated[query] = matches;
    syncFriendlyNamesWithQueries(updated, queryInputs);
    return updated
}


function syncFriendlyNamesWithQueries(queriesMatches: QueryMatches, queryInputs: StringToString) {
    for (const friendlyName in queryInputs) {
        queriesMatches[friendlyName] = queriesMatches[queryInputs[friendlyName]]
    }
}

function getQueriesProxy(queries: { [key: string]: boolean }, queryInputs: StringToString) {
    return new Proxy(queries, {
        get(target, key: any) {
            if (target[key] === undefined) {
                console.warn(`You attempted to access the media query '${key}' but you didn't pass it into your useMediaQueries() function call. You passed in:`, queryInputs)
            }
            return target[key];
        }
    });
}