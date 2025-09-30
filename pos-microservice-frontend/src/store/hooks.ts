// src/store/hooks.ts
import type { TypedUseSelectorHook } from "react-redux";
import { useDispatch, useSelector, useStore } from "react-redux";
import type { AppDispatch, RootState, AppStore } from "./index";

// typed helpers using generics (works on all react-redux versions)
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore = () => useStore<AppStore>();
