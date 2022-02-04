import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { ParamDesc } from "@gpu/types"
import { SetterOrUpdater, useRecoilState } from "recoil"
import { Flex, Input, Text, Box, BoxProps, IconButton } from '@chakra-ui/react'
import { themed } from 'theme/theme'
import { useResizeDetector } from 'react-resize-detector'
import { projectParamsAtom } from '@recoil/project'
import Dropdown, { DropdownItem } from '../dropdown'
import { Vec2InterfaceRadial } from './interface/vec2Interface'
import { FiMoreHorizontal } from 'react-icons/fi'


export const typeToInterface = {
  'int': ['Scroll', 'Step Scroll'],
  'float': ['Scroll', 'Step Scroll'],
  'color': ['RGB', 'HSV'],
  'vec3f': [],
  'vec3i': [],
  'vec2f': ['Radial'],
  'vec2i': [],
}

export const interfaces: { [key: string]: ReactNode } = {
  'Scroll': Vec2InterfaceRadial,
  'Radial': Vec2InterfaceRadial
}

export type InterfaceProps = {
  value: number[],
  onChange: (newval: number[]) => void,
  width: number,
  height: number,
  mouseX: number,
  mouseY: number,
}

export const ParamInterface = (props: { selectedParam: string | null } & BoxProps) => {

  const { selectedParam, ...rest } = props

  const [param, setParam] = useRecoilState(projectParamsAtom(props.selectedParam ?? ''))
  const paramInterface = param ? interfaces[typeToInterface[param.paramType][0]] : null
  const { width, height, ref } = useResizeDetector()

  const onHandleValueChange = (newval: number[]) => {
    setParam(old => ({ ...old, param: newval }))
  }


  return (

    <Box
      position="relative"
      ref={ref}
      style={{ aspectRatio: '1/1' }}
      flex="0 0 auto"
      bg={themed('a3')}
      flexDir="column"
      borderLeft="1px solid"
      borderColor={themed('dividerLight')}
      overflow="hidden"
      {...rest}
    >
      <IconButton variant="empty" position="absolute" right="0%" icon={<FiMoreHorizontal color="white" />} />


      {
        paramInterface && props.selectedParam &&
        React.createElement(
          paramInterface,
          {
            value: param.param,
            onChange: onHandleValueChange,
            width: width ? width : 0,
            height: height ? height : 0
          }
        )
      }
    </Box>
  )
}

export const useInterface = (
  props: InterfaceProps,
  toParamSpace: (svgCoord: number[]) => number[],
  fromParamSpace: (paramCoord: number[]) => number[],
) => {

  const ref = useRef<SVGSVGElement | null>(null)
  const [svgCoord, setSVGCoord] = useState(fromParamSpace(props.value))
  const [dragged, setDragged] = useState(false)
  const [scroll, setScroll] = useState(0)

  const preventGlobalMouseEvents = () => document.body.style.pointerEvents = 'none'
  const restoreGlobalMouseEvents = () => document.body.style.pointerEvents = 'auto'

  const iterate = useCallback((ev: MouseEvent) => {

    const toSvgSpace = (vec: number[]): number[] => {
      if (!ref.current) return vec
      const bbox = ref.current.getBoundingClientRect()
      return [vec[0] - bbox.left, vec[1] - bbox.top]
    }

    ev.stopPropagation()
    const windowCoord = [ev.clientX, ev.clientY]
    const svgCoord = toSvgSpace(windowCoord)
    setSVGCoord(svgCoord)
    const paramCoord = toParamSpace(svgCoord)
    props.onChange(paramCoord)
    //console.log('window', windowCoord, 'svg', svgCoord, 'param', paramCoord)
  }, [toParamSpace, setSVGCoord, props])

  const end = useCallback((ev: MouseEvent) => {
    restoreGlobalMouseEvents()
    document.removeEventListener('mouseup', end)
    document.removeEventListener('mousemove', iterate)
    ev.stopPropagation()
    setDragged(false)
  }, [iterate])

  useEffect(() => {
    return () => {
      restoreGlobalMouseEvents();
      document.removeEventListener('mouseup', end, { capture: true })
      document.removeEventListener('mousemove', iterate, { capture: true })
    }
  }, [end, iterate])

  useEffect(() => {
    function start(ev: MouseEvent) {
      preventGlobalMouseEvents()
      document.addEventListener('mouseup', end)
      document.addEventListener('mousemove', iterate)
      ev.preventDefault()
      ev.stopPropagation()
      setDragged(true)
    }

    if (ref.current) {
      ref.current.onmousedown = start
    }
  }, [end, iterate, props.value, ref])

  const toDocumentSpace = (vec: number[]): number[] => {
    if (!ref.current) return vec
    const bbox = ref.current.getBoundingClientRect()
    return [vec[0] + bbox.left, vec[1] + bbox.top]
  }

  return {
    svgCoord,
    dragged,
    toDocumentSpace,
    ref
  }
}


