export declare type SetStateAction<S> = S | ((prevState: S) => S);
export declare type Dispatch<A> = (value: A) => void;
export declare type StringToString = {
    [key: string]: string;
};
export declare type QueryLists = {
    [key: string]: MediaQueryList;
};
export declare type QueriesMatches = {
    [key: string]: boolean;
};
export default function useMediaQueries<T extends StringToString>(queriesByFriendlyNames: T): {
    [Property in keyof T]: boolean;
};
