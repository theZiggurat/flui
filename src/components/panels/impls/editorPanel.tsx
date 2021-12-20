import {
    Box, Button, Flex, Input, Popover, PopoverContent, PopoverTrigger, Portal, useColorModeValue
} from '@chakra-ui/react';
import * as types from '@gpu/types';
import useInstance from '@recoil/hooks/useInstance';
import { currentProjectIDAtom, projectShaderErrorsAtom, projectShadersAtom } from '@recoil/project';
import "prismjs";
// @ts-ignore
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-rust";
import React, { useCallback } from 'react';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdAdd, MdClose, MdCode, MdSettings } from 'react-icons/md';
import { RiArrowDropDownLine, RiArrowDropUpLine } from 'react-icons/ri';
import Editor from 'react-simple-code-editor';
import { useRecoilState, useRecoilValue } from 'recoil';
import { darkEditor, lightEditor } from '../../../theme/consts';
import { themed } from '../../../theme/theme';
import { RowButton } from '../../shared/rowButton';
import { EditorInstanceState } from '../descriptors';
import { DynamicPanelProps, Panel, PanelBar, PanelBarEnd, PanelBarMiddle, PanelContent } from '../panel';


export const hightlightWithLineNumbers = (input, language, filename, fileErrors) =>
    highlight(input, language)
        .split("\n")
        .map((line: string, i: number) => i == fileErrors[filename] - 1 ? `<span class="editorLineNumberTest">${line}</span>` : line)
        .map((line: string, i: number) => `<span class='editorLineNumber'>${i + 1}</span>${line}`)
        .join("\n");

interface EditorProps {
    onEditCode: (idx: number, code: string) => void,
    onEditFileName: (idx: number, code: string) => void,
    onCreateFile: (lang: types.Lang) => number,
    onDeleteFile: (idx: number) => void,
    files: types.CodeFile[],
}

const EditorPanel = (props: EditorProps & DynamicPanelProps) => {

    const [instanceState, setInstanceState] = useInstance<EditorInstanceState>(props)
    const { files, onEditCode, onCreateFile, onDeleteFile, onEditFileName } = useEditorPanel()
    const fileErrorValue = useRecoilValue(projectShaderErrorsAtom)

    const [workspace, setWorkspace] = React.useState<number[]>([])

    const setCurrentFileIndex = (index: number) => {
        setInstanceState({ ...instanceState, currentFileIndex: index })
    }

    const [isFileDrawerOpen, setFileDrawerOpen] = React.useState(false)
    const toggleDrawer = () => setFileDrawerOpen(isopen => !isopen)
    const closeDrawer = () => setFileDrawerOpen(false)

    const currentFile = files[instanceState.currentFileIndex]

    const onHandleFilenameChange = (ev) => onEditFileName(instanceState.currentFileIndex, ev.target.value)
    const onHandleAddFile = () => {
        let newIdx = onCreateFile('wgsl')
        setCurrentFileIndex(newIdx)
    }

    const onHandleSelectFile = (idx: number) => {
        setCurrentFileIndex(idx)
        if (idx! in workspace)
            setWorkspace(prev => [...prev, idx])
        closeDrawer()
    }

    return (
        <Panel {...props}>
            <PanelContent>
                <Box width="100%" height="100%" sx={useColorModeValue(lightEditor, darkEditor)}>
                    {
                        currentFile &&
                        <Editor
                            className="editor"
                            textareaId="codeArea"
                            value={currentFile.file}
                            onValueChange={code => onEditCode(instanceState.currentFileIndex, code)}
                            highlight={code => hightlightWithLineNumbers(code, languages.rust, currentFile.filename, fileErrorValue)}
                            padding={20}
                            style={{
                                fontFamily: '"JetBrains Mono","Fira code", "Fira Mono", monospace',
                                fontSize: 13,
                            }}
                        />
                    }
                </Box>
            </PanelContent>
            <PanelBar preventScroll={isFileDrawerOpen}>
                <PanelBarMiddle zIndex="3">
                    <RowButton
                        purpose="Browse files"
                        icon={isFileDrawerOpen ? <RiArrowDropDownLine size={17} /> : <RiArrowDropUpLine size={17} />}
                        onClick={toggleDrawer}
                        first
                    />
                    <Popover
                        placement='top-start'
                        gutter={0}
                        preventOverflow
                        isOpen={isFileDrawerOpen}
                        onClose={closeDrawer}
                        modifiers={[
                            {
                                name: 'preventOverflow',
                                options: {
                                    tether: false,
                                }
                            }
                        ]}
                    >
                        <PopoverTrigger>
                            <Input
                                size="sm"
                                maxWidth="500"
                                minWidth="200"
                                width="200"
                                borderRadius="0"
                                borderLeft="0"
                                onChange={onHandleFilenameChange}
                                value={currentFile ? currentFile.filename : ''}
                                fontWeight="light"
                                autoCorrect="off"
                                spellCheck="false"
                            />
                        </PopoverTrigger>
                        <Portal>
                            <PopoverContent
                                zIndex="10"
                                width="fit-content"
                                border="0"
                            >
                                <Flex
                                    direction="column"
                                    width="200px"
                                    backgroundColor={themed('a2')}
                                    borderTopRadius="6px"
                                >
                                    {
                                        files.map((file, idx) =>
                                            <Button
                                                size="sm"
                                                bg={idx == instanceState.currentFileIndex ?
                                                    useColorModeValue("light.inputHovered", 'dark.inputHovered') :
                                                    useColorModeValue("light.input", 'dark.input')
                                                }
                                                borderBottomRadius="0px"
                                                borderBottom="0"
                                                borderTopRadius={idx != 0 ? "0px" : "5px"}
                                                fontWeight="light"
                                                onClick={() => onHandleSelectFile(idx)}
                                                justifyContent="start"
                                            >
                                                {`${file.filename}.${file.lang}`}
                                            </Button>
                                        )
                                    }
                                </Flex>
                            </PopoverContent>
                        </Portal>
                    </Popover>
                    <RowButton
                        purpose="Add file"
                        onClick={onHandleAddFile}
                        icon={<MdAdd size={17} />}
                    />
                    <RowButton
                        purpose="Remove file from workspace"
                        icon={<MdClose size={17} />}
                        last
                    />
                </PanelBarMiddle>
                <PanelBarEnd>
                    <RowButton
                        purpose="Check code"
                        size="sm"
                        icon={<MdCode />}
                        first
                    />
                    <RowButton
                        purpose="Delete file"
                        icon={<FaRegTrashAlt />}
                    />
                    <RowButton
                        purpose="Settings"
                        icon={<MdSettings />}
                        last
                    />
                </PanelBarEnd>
            </PanelBar>
        </Panel>
    )
}

export const useEditorPanel = (): EditorProps => {

    const projectID = useRecoilValue(currentProjectIDAtom)
    const [filesState, setFiles] = useRecoilState(projectShadersAtom(projectID))

    const onEditCode = useCallback((idx: number, code: string) => {
        setFiles(prevCode => {
            let updated = [...prevCode]
            updated[idx] = {
                ...prevCode[idx],
                file: code
            }
            return updated
        })
    }, [filesState])

    const onCreateFile = useCallback((lang: types.Lang): number => {
        let idx = 0
        let len = filesState.length
        while (filesState.map((c) => c.filename).includes(`shader${idx}`))
            ++idx
        setFiles(prevCode => [...prevCode, {
            filename: `shader${idx}`,
            file: '',
            lang: lang
        }])
        return len
    }, [filesState])

    const onDeleteFile = useCallback((idx: number) => {
        setFiles(prevCode => {
            let updated = [...prevCode]
            updated.splice(idx, 1)
            return updated
        })
    }, [filesState])

    const onEditFileName = useCallback((idx: number, filename: string) => {
        setFiles(prevCode => {
            let updated = [...prevCode]
            updated[idx] = Object.assign({}, prevCode[idx], { filename })
            return updated
        })
    }, [filesState])

    return { files: filesState, onEditCode, onCreateFile, onDeleteFile, onEditFileName }
}

export default EditorPanel;