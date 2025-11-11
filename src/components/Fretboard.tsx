import { useMemo } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { GuitarPosition } from '../utils/noteUtils'
import styles from './Fretboard.module.css'

const STRINGS: GuitarPosition['string'][] = [1, 2, 3, 4, 5, 6]
const STRING_LABELS: Record<GuitarPosition['string'], string> = {
  1: 'E',
  2: 'B',
  3: 'G',
  4: 'D',
  5: 'A',
  6: 'E',
}
const FRETS = Array.from({ length: 12 }, (_, index) => index + 1)
const MARKER_FRETS = [3, 5, 7, 9, 12]
const CELL_WIDTH = 55
const BOARD_TOP = 40
const BOARD_HEIGHT = 240
const BOARD_START_X = 70
const BOARD_WIDTH = CELL_WIDTH * FRETS.length
const BOARD_END_X = BOARD_START_X + BOARD_WIDTH
const OPEN_X = BOARD_START_X - 28
const LABEL_X = OPEN_X - 20

type FretboardProps = {
  activePosition?: GuitarPosition | null
  highlightedPositions?: GuitarPosition[]
  disabledPositions?: GuitarPosition[]
  onSelect: (position: GuitarPosition) => void
  onNavigate?: (delta: { stringDelta: number; fretDelta: number }) => void
  labelledBy?: string
}

function Fretboard({
  activePosition,
  highlightedPositions = [],
  disabledPositions = [],
  onSelect,
  onNavigate,
  labelledBy,
}: FretboardProps) {
  const highlightedKey = useMemo(
    () =>
      new Set(
        highlightedPositions.map((position) =>
          positionKey(position.string, position.fret),
        ),
      ),
    [highlightedPositions],
  )
  const disabledKey = useMemo(
    () =>
      new Set(
        disabledPositions.map((position) =>
          positionKey(position.string, position.fret),
        ),
      ),
    [disabledPositions],
  )

  const handleKeyDown = (event: ReactKeyboardEvent<SVGSVGElement>) => {
    if (!onNavigate) {
      return
    }
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        onNavigate({ stringDelta: -1, fretDelta: 0 })
        break
      case 'ArrowDown':
        event.preventDefault()
        onNavigate({ stringDelta: 1, fretDelta: 0 })
        break
      case 'ArrowLeft':
        event.preventDefault()
        onNavigate({ stringDelta: 0, fretDelta: -1 })
        break
      case 'ArrowRight':
        event.preventDefault()
        onNavigate({ stringDelta: 0, fretDelta: 1 })
        break
      case 'Enter':
      case ' ':
        if (activePosition) {
          const key = positionKey(activePosition.string, activePosition.fret)
          if (!disabledKey.has(key)) {
            event.preventDefault()
            onSelect(activePosition)
          }
        }
        break
      default:
        break
    }
  }

  return (
    <div className={styles.fretboardWrapper}>
      <svg
        className={styles.fretboard}
        viewBox={`0 0 ${BOARD_END_X + 90} 340`}
        role="application"
        tabIndex={0}
        aria-labelledby={labelledBy}
        onKeyDown={handleKeyDown}
      >
        <rect
          x={BOARD_START_X}
          y={BOARD_TOP}
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          rx={16}
          className={styles.body}
        />
        <line
          x1={BOARD_START_X}
          y1={BOARD_TOP}
          x2={BOARD_START_X}
          y2={BOARD_TOP + BOARD_HEIGHT}
          className={styles.nut}
        />
        {STRINGS.map((string, index) => {
          const y = BOARD_TOP + 20 + index * 40
          return (
            <line
              key={`string-${string}`}
              x1={BOARD_START_X}
              y1={y}
              x2={BOARD_END_X}
              y2={y}
              className={styles.stringLine}
            />
          )
        })}
        {STRINGS.map((string, index) => {
          const y = BOARD_TOP + 20 + index * 40
          return (
            <text
              key={`label-${string}`}
              x={LABEL_X}
              y={y}
              className={styles.stringLabel}
            >
              {STRING_LABELS[string]}
            </text>
          )
        })}
        {FRETS.map((fret) => {
          const x = BOARD_START_X + (fret - 1) * CELL_WIDTH
          return (
            <line
              key={`fret-${fret}`}
              x1={x}
              y1={BOARD_TOP}
              x2={x}
              y2={BOARD_TOP + BOARD_HEIGHT}
              className={styles.fretLine}
            />
          )
        })}
        {MARKER_FRETS.map((fret) => {
          const x = BOARD_START_X + (fret - 0.5) * CELL_WIDTH
          const isDouble = fret === 12
          return (
            <g key={`marker-${fret}`}>
              <circle
                cx={x}
                cy={BOARD_TOP + 80}
                r={6}
                className={styles.fretMarker}
              />
              <circle
                cx={x}
                cy={BOARD_TOP + 160}
                r={6}
                className={styles.fretMarker}
              />
              {isDouble ? (
                <>
                  <circle
                    cx={x}
                    cy={BOARD_TOP + 40}
                    r={6}
                    className={styles.fretMarker}
                  />
                  <circle
                    cx={x}
                    cy={BOARD_TOP + 200}
                    r={6}
                    className={styles.fretMarker}
                  />
                </>
              ) : null}
            </g>
          )
        })}
        {STRINGS.map((string, stringIndex) => {
          const y = BOARD_TOP + stringIndex * 40
          const centerY = y + 20
          const openKey = positionKey(string, 0)
          const isOpenDisabled = disabledKey.has(openKey)
          const isOpenActive =
            !!activePosition &&
            activePosition.string === string &&
            activePosition.fret === 0
          const isOpenHighlighted = highlightedKey.has(openKey)
          const openClassName = [
            styles.openHit,
            isOpenActive ? styles.active : '',
            !isOpenActive && isOpenHighlighted ? styles.highlighted : '',
            isOpenDisabled ? styles.disabled : '',
          ]
            .filter(Boolean)
            .join(' ')
          const handleOpenSelect = () => {
            if (isOpenDisabled) {
              return
            }
            onSelect({ string, fret: 0 })
          }
          return (
            <g
              key={`open-${string}`}
              className={styles.openPosition}
              onClick={handleOpenSelect}
            >
              <circle
                cx={OPEN_X}
                cy={centerY}
                r={12}
                role="button"
                tabIndex={-1}
                aria-label={`String ${string}, open`}
                data-selected={isOpenActive ? 'true' : undefined}
                data-highlighted={isOpenHighlighted ? 'true' : undefined}
                data-disabled={isOpenDisabled ? 'true' : undefined}
                className={openClassName}
              />
              {isOpenDisabled ? (
                <path
                  d={`M ${OPEN_X - 6} ${centerY} l 4 6 l 10 -12`}
                  className={styles.disabledCheck}
                />
              ) : null}
              {isOpenActive ? (
                <circle
                  cx={OPEN_X}
                  cy={centerY}
                  r={8}
                  className={styles.selection}
                />
              ) : null}
              {isOpenHighlighted && !isOpenActive ? (
                <circle
                  cx={OPEN_X}
                  cy={centerY}
                  r={6}
                  className={styles.highlightDot}
                />
              ) : null}
            </g>
          )
        })}
        {STRINGS.map((string, stringIndex) =>
          FRETS.map((fret) => {
            const x = BOARD_START_X + (fret - 1) * CELL_WIDTH
            const y = BOARD_TOP + stringIndex * 40
            const key = positionKey(string, fret)
            const isDisabled = disabledKey.has(key)
            const isActive =
              activePosition &&
              activePosition.string === string &&
              activePosition.fret === fret
            const isHighlighted = highlightedKey.has(key)
            const rectClassName = [
              styles.hitArea,
              isDisabled ? styles.disabled : '',
              isActive ? styles.active : '',
              !isActive && isHighlighted ? styles.highlighted : '',
            ]
              .filter(Boolean)
              .join(' ')
            const handleSelect = () => {
              if (isDisabled) {
                return
              }
              onSelect({ string, fret })
            }
            return (
              <g
                key={key}
                className={styles.position}
                role="presentation"
                onClick={handleSelect}
              >
                <rect
                  x={x}
                  y={y}
                  width={CELL_WIDTH}
                  height={40}
                  role="button"
                  tabIndex={-1}
                  data-highlighted={isHighlighted ? 'true' : undefined}
                  data-selected={isActive ? 'true' : undefined}
                  data-disabled={isDisabled ? 'true' : undefined}
                  className={rectClassName}
                  aria-label={`String ${string}, fret ${fret}`}
                />
                {isDisabled ? (
                  <path
                    d={`M ${x + 8} ${y + 22} l 8 10 l 16 -18`}
                    className={styles.disabledCheck}
                  />
                ) : null}
                {isActive ? (
                  <circle
                    cx={x + CELL_WIDTH / 2}
                    cy={y + 20}
                    r={10}
                    className={styles.selection}
                  />
                ) : null}
                {isHighlighted && !isActive ? (
                  <circle
                    cx={x + CELL_WIDTH / 2}
                    cy={y + 20}
                    r={8}
                    className={styles.highlightDot}
                  />
                ) : null}
              </g>
            )
          }),
        )}
        <g aria-hidden="true">
          {FRETS.map((fret) => {
            const x = BOARD_START_X + (fret - 1) * CELL_WIDTH
            return (
              <text
                key={`label-${fret}`}
                x={x + CELL_WIDTH / 2}
                y={BOARD_TOP + BOARD_HEIGHT + 30}
                className={styles.fretLabel}
              >
                {fret}
              </text>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

function positionKey(string: number, fret: number) {
  return `${string}-${fret}`
}

export default Fretboard
