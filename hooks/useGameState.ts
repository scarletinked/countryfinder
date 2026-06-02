"use client";

import { useReducer } from "react";
import type { GameState, GameAction, CountryFeature } from "@/types";

export const ROUNDS_PER_GAME = 10;

function makeRound(country: CountryFeature, roundNumber: number) {
  return {
    roundNumber,
    targetCountry: country,
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
        countries: action.countries,
        currentRound: 0,
        rounds: [makeRound(action.countries[0], 1)],
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
        rounds: [
          ...state.rounds,
          makeRound(state.countries[next], next + 1),
        ],
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
  countries: [],
  currentRound: 0,
  rounds: [],
  totalScore: 0,
  markerPosition: null,
};

export function useGameState() {
  return useReducer(reducer, initialState);
}
