/** E = 1 / (1 + 10^((rb - ra) / 400)) */
export function expectedScore(ra: number, rb: number): number {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400))
}

/** Calculates new ELO for one player. score: 1=win, 0.5=draw, 0=loss. K=32 by default. */
export function newElo(ra: number, rb: number, score: 0 | 0.5 | 1, k = 32): number {
  return Math.round(ra + k * (score - expectedScore(ra, rb)))
}

export function applyEloMatch(
  elosPareja1: [number, number],
  elosPareja2: [number, number],
  ganador: 'pareja1' | 'pareja2'
): { pareja1: [number, number]; pareja2: [number, number] } {
  const avgElo2 = (elosPareja2[0] + elosPareja2[1]) / 2
  const avgElo1 = (elosPareja1[0] + elosPareja1[1]) / 2

  const score1: 0 | 1 = ganador === 'pareja1' ? 1 : 0
  const score2: 0 | 1 = ganador === 'pareja2' ? 1 : 0

  return {
    pareja1: [
      newElo(elosPareja1[0], avgElo2, score1),
      newElo(elosPareja1[1], avgElo2, score1),
    ],
    pareja2: [
      newElo(elosPareja2[0], avgElo1, score2),
      newElo(elosPareja2[1], avgElo1, score2),
    ],
  }
}
