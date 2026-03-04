# Project Documentation

## Goal

Create a small chess-inspired game for children to practice chess movement patterns.

Target user: a 9-year-old learning chess.

The design prioritizes:

- simplicity
- short matches
- visual understanding of piece movement

## Core Concept

This game combines:

Chess movement rules + Tic Tac Toe victory condition.

Players must coordinate pieces to create a line of three.

## Design Decisions

### 3×3 Board

Chosen because:

- simple
- fast games
- easy visualization for children

### No Captures

Captures introduce extra complexity.

The goal of this game is to train:

- movement
- coordination
- spatial awareness

### Two Phases

1. Placement
2. Movement

Placement ensures both players begin with equal material.

### Pieces

Each player has:

- Rook
- Bishop
- Knight

These pieces were chosen because they represent **three distinct movement types**.

## Movement Rules

Same as chess:

Rook  
→ horizontal / vertical

Bishop  
→ diagonal

Knight  
→ L shape

Pieces may only move to empty squares.

## Victory Condition

Three pieces in:

- row
- column
- diagonal

## Technology

Stack:

HTML  
CSS  
Vanilla JavaScript

Reason:

- simplicity
- zero dependencies
- GitHub Pages compatibility

## PWA Support

Includes:

- manifest.json
- service-worker.js

Allows installation on phones.

## File Tree

index.html - Main UI layout. Contains board container and loads game.

style.css - Visual design. Controls board grid and piece appearance.

game.js. - Core game logic. Contains: - board state; - movement rules; - victory detection; - turn system

manifest.json - Defines PWA metadata.

service-worker.js - Provides offline support.

README.md - User-facing documentation.

PROJECT.md:

Developer documentation.

## Future Improvements

### 1. Move indicators

Highlight valid moves (already partially implemented).

### 2. Statistics

Track:

- wins
- losses
- draws

Useful for children.

### 3. 4×4 Expansion

Possible advanced mode.

Potential additional piece:

Queen.

### 4. AI opponent

Simple minimax AI could allow solo play.

### 5. Animated movement

Improve UX.

### 6. Puzzle Mode

Generate tactical challenges such as:

"Win in 1 move".

## Long-term Vision

Turn this project into a small **educational chess mini-game collection**.

Examples:

- mini endgames
- piece movement puzzles
- tactical training
