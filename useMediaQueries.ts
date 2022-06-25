import { useEffect, useState, Dispatch, SetStateAction } from "react";

type StringToString = { [key: string]: string }
export type QueryLists = { [key: string]: MediaQueryList }
export type QueriesMatches = { [key: string]: boolean }

export default function useMediaQueries<T extends StringToString>(queriesByFriendlyNames: T): { [Property in keyof T]: boolean } { 
    const initialQueriesMatches: QueriesMatches = {};
    for (const friendlyName in queriesByFriendlyNames) {
        const query = queriesByFriendlyNames[friendlyName];
        initialQueriesMatches[friendlyName] = initialQueriesMatches[friendlyName] || false;
        initialQueriesMatches[query] = initialQueriesMatches[query] || false;
    }

    const queryLists: QueryLists = {}
    const [staleQueriesMatches, queueUpdateQueriesMatches] = useState<QueriesMatches>(initialQueriesMatches);

    useEffect(onceAfterFirstRender, [])
    function onceAfterFirstRender() {
        loadQueryListsFromWindow(queryLists, queriesByFriendlyNames);
        const updatedQueriesMatches: QueriesMatches = {}
        for (const friendlyName in queriesByFriendlyNames) {
            const query = queriesByFriendlyNames[friendlyName]
            updatedQueriesMatches[query] = queryLists[query]?.matches;
        };
        syncFriendlyNamesWithQueries(updatedQueriesMatches, queriesByFriendlyNames)
        queueUpdateQueriesMatches(updatedQueriesMatches);
        const listenerReferencesByQuery = addListenersAndGetTheirReferences(
            staleQueriesMatches,
            queryLists,
            queriesByFriendlyNames,
            queueUpdateQueriesMatches
        )

        function cleanup() { 
            for (const query in listenerReferencesByQuery) {
                queryLists[query].removeEventListener('change', listenerReferencesByQuery[query])
            }
        }
        return cleanup
    }

    const proxy = getQueriesProxy(staleQueriesMatches, queriesByFriendlyNames);
    return proxy as { [Property in keyof T]: boolean };
}


function loadQueryListsFromWindow(queryLists: QueryLists, queryInputs: StringToString) {
    for (const friendlyName in queryInputs) {
        const query = queryInputs[friendlyName]
        queryLists[query] = window.matchMedia(query);
        queryLists[friendlyName] = queryLists[query]
    }
}

function addListenersAndGetTheirReferences(
    queriesMatches: QueriesMatches,
    queryLists: QueryLists,
    queryInputs: StringToString,
    queueUpdateQueriesMatches: Dispatch<SetStateAction<{ [key: string]: boolean }>>
) {

    const listenersByQuery: { [key: string]: any } = {};

    for (const queryList in queryLists) {
        const listener = (event: MediaQueryListEvent) => {

            const currentList = event.target as MediaQueryList;
            queueUpdateQueriesMatches(currentMatches => {
                const updated = { ...currentMatches };
                updated[queryList] = currentList.matches;
                syncFriendlyNamesWithQueries(updated, queryInputs);
                return updated
            })
            queriesMatches[queryList] = currentList.matches

        }
        queryLists[queryList].addEventListener('change', listener);
        listenersByQuery[queryList] = listener;
    }
    return listenersByQuery
}


function syncFriendlyNamesWithQueries(queries: QueriesMatches, queryInputs: StringToString) {
    for (const key in queryInputs) {
        queries[key] = queries[queryInputs[key]]
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