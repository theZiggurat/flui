
import React, { useState } from "react"
import useProjectDirect from "@core/hooks/useProjectDirect"
import {
  Text,
  Box,
  Center,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react'
import Link from "next/link"
import { CreatePageProjectQueryWithId } from "core/types/queries"

const ProjectCard = (props: {
  project: CreatePageProjectQueryWithId
  autoplay?: boolean
  bg?: boolean
  bgScale?: number
  blur?: number
  onHover?: (hovered: boolean) => void,
}) => {

  const {
    project,
    autoplay = false,
    bg = false,
    bgScale = 1,
    blur = 16,
    onHover
  } = props

  const [loading, setPlaying] = useProjectDirect(project, autoplay, project.id, `${project.id}_bg`)
  const [hovered, setHovered] = useState(false)
  const textBg = useColorModeValue("light.bg", 'dark.bg')

  const onHandleHover = () => {
    onHover ? onHover(true) : null
    setHovered(true)
    if (!autoplay)
      setPlaying(true)
  }
  const onHandleLeave = () => {
    onHover ? onHover(false) : null
    setHovered(false)
    if (!autoplay)
      setPlaying(false)
  }

  return (
    <Link href={`/editor/${project.id}`} passHref>
      <Box
        width="100%"
        height="100%"
        position="relative"
        onMouseEnter={onHandleHover}
        onMouseLeave={onHandleLeave}
        className="group"
        transition="transform 0.2s ease"
        cursor="pointer"
      // _hover={{
      //   transform: 'scale(1.005)'
      // }}
      >
        {
          loading &&
          <Center width='100%' height='100%' position='absolute'>
            <Spinner zIndex={5}></Spinner>
          </Center>
        }
        <canvas
          id={project.id}
          width="100%"
          height="100%"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            zIndex: 1,
            visibility: loading ? 'hidden' : 'visible',
            opacity: loading ? 0 : 1,
            transition: 'opacity 1.0s ease',
            pointerEvents: 'none',
          }}
        />
        {
          bg && <canvas
            id={`${project.id}_bg`}
            width="100%"
            height="100%"
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              zIndex: 0,
              opacity: hovered ? 1 : 0,
              transform: `scale(${bgScale})`,
              filter: `blur(${blur}px) contrast(200%)`,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none'
            }}
          />
        }
        <Text
          position="relative"
          display="block"
          width="fit-content"
          bg={textBg}
          p="0.7rem"
          top="-1px"
          left="-1px"
          fontSize="xx-large"
          fontStyle="normal"
          fontWeight="bold"
          //fontFamily="'JetBrains Mono'"
          zIndex={2}
        >
          {props.project?.title ?? "Placeholder"}
        </Text>
        <Text
          position="relative"
          display="inline"
          bg={textBg}
          p="0.5rem"
          pl="0.7rem"
          left="-1px"
          fontSize="med"
          fontFamily="'JetBrains Mono'"
          zIndex={2}
        >
          {props.project?.author?.name ?? "Placeholder Author"}
        </Text>
        <Text
          position="absolute"
          bottom="0%"
          left="-1px"
          transform="auto"
          transformOrigin="bottom"
          display="inline"
          bg={textBg}
          p="0.5rem"
          pl="0.7rem"
          fontSize="med"
          fontFamily="'JetBrains Mono'"
          zIndex={2}
          scaleY={0}
          transition="transform 0.2s ease"
          _groupHover={{
            scaleY: 1
          }}
        >
          {props.project?.description}
        </Text>
      </Box>
    </Link>
  )
}

export default ProjectCard