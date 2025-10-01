// src/lib/store/hooks.ts

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Типизированный useDispatch хук
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Типизированный useSelector хук
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;