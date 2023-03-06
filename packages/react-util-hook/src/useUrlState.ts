import { useMemoizedFn, useUpdate } from 'ahooks'
import queryString from 'query-string'
import type { ParseOptions, StringifyOptions } from 'query-string'
import { useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export interface Options {
  navigateMode?: 'push' | 'replace'
  parseOptions?: ParseOptions
  stringifyOptions?: StringifyOptions
}

const baseParseConfig: ParseOptions = {
  parseNumbers: false,
  parseBooleans: false,
}

const baseStringifyConfig: StringifyOptions = {
  skipNull: false,
  skipEmptyString: false,
}

type UrlState = Record<string, any>

const useUrlState = <S extends UrlState = UrlState>(initialState?: S | (() => S), options?: Options) => {
  type State = Partial<{ [key in keyof S]: any }>
  const { navigateMode = 'push', parseOptions, stringifyOptions } = options || {}

  const mergedParseOptions = { ...baseParseConfig, ...parseOptions }
  const mergedStringifyOptions = { ...baseStringifyConfig, ...stringifyOptions }

  const location = useLocation()

  const navigate = useNavigate()

  const update = useUpdate()

  const initialStateRef = useRef(typeof initialState === 'function' ? (initialState as () => S)() : initialState || {})

  const queryFromUrl = useMemo(() => {
    return queryString.parse(location.search, mergedParseOptions)
  }, [location.search])

  const targetQuery: State = useMemo(
    () => ({
      ...initialStateRef.current,
      ...queryFromUrl,
    }),
    [queryFromUrl],
  )

  const setState = (s: React.SetStateAction<State>) => {
    const newQuery = typeof s === 'function' ? s(targetQuery) : s

    // 1. 如果 setState 后，search 没变化，就需要 update 来触发一次更新。比如 demo1 直接点击 clear，就需要 update 来触发更新。
    // 2. update 和 history 的更新会合并，不会造成多次更新
    update()

    navigate(
      {
        hash: location.hash,
        search: queryString.stringify({ ...queryFromUrl, ...newQuery }, mergedStringifyOptions) || '?',
      },
      {
        replace: navigateMode === 'replace',
        state: location.state,
      },
    )
  }

  return [targetQuery, useMemoizedFn(setState)] as const
}

export { useUrlState }
