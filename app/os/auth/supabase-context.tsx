"use client";
import { createContext } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthConfig } from "./supabase-client";

export const SupabaseConnection = createContext<{ client: SupabaseClient; config: AuthConfig } | null>(null);
