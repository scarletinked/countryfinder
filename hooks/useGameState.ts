"use client";

import { useReducer } from "react";
import type { GameState, GameAction, CountryFeature, Tier } from "@/types";
import { nextTierState } from "@/lib/difficulty";

export const ROUNDS_PER_GAME = 10;

function makeRound(country: CountryFeature, roundNumber: number, tier: Tier) {
  return {
    roundNumber,
    targetCountry: country,
    tier,
    clickedLngLat: null,
    score: null,
    distanceMiles: null,
    isCorrect: null,
  };
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      return {
        phase: "playing",
        mode: action.mode,
        currentRound: 0,
        tier: "easy",
        streak: 0,
        rounds: [makeRound(action.country, 1, "easy")],
        totalScore: 0,
        markerPosition: null,
      };

    case "PLACE_MARKER":
      return { ...state, markerPosition: action.lngLat };

    case "SUBMIT_GUESS": {
      const round = state.rounds[state.currentRound];
      const updated = {
        ...round,
        clickedLngLat: state.markerPosition,
        score: action.score,
        distanceMiles: action.distanceMiles,
        isCorrect: action.isCorrect,
      };
      return {
        ...state,
        ...nextTierState(state.tier, state.streak, action.isCorrect),
        phase: "round-result",
        rounds: [...state.rounds.slice(0, state.currentRound), updated],
        totalScore: state.totalScore + action.score,
      };
    }

    case "NEXT_ROUND": {
      const next = state.currentRound + 1;
      if (next >= ROUNDS_PER_GAME) {
        return { ...state, phase: "game-over" };
      }
      return {
        ...state,
        phase: "playing",
        currentRound: next,
        rounds: [...state.rounds, makeRound(action.country, next + 1, state.tier)],
        markerPosition: null,
      };
    }

    case "RESET_GAME":
      return initialState;

    default:
      return state;
  }
}

const initialState: GameState = {
  phase: "home",
  mode: "standard",
  currentRound: 0,
  tier: "easy",
  streak: 0,
  rounds: [],
  totalScore: 0,
  markerPosition: null,
};

export function useGameState() {
  return useReducer(reducer, initialState);
}
