import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['constellation']
type SetContext = (v: persisted.Schema['constellation']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.constellation,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['constellation']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('constellation'))

  const setStateWrapped = React.useCallback(
    (constellation: persisted.Schema['constellation']) => {
      setState(constellation)
      persisted.write('constellation', constellation)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('constellation', nextConstellationEnabled => {
      setState(nextConstellationEnabled)
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useConstellationPrefs() {
  return {
    ...(persisted.defaults.constellation as {enabled: boolean; url: string}),
    ...React.useContext(stateContext),
  }
}

export function useSetConstellationPrefs() {
  return React.useContext(setContext)
}
