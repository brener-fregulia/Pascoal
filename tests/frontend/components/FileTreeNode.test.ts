import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import FileTreeNode from '../../../src/project/FileTreeNode.svelte'
import type { ExplorerNode } from '../../../src/project/explorerStore'

afterEach(() => cleanup())

function fileNode(overrides: Partial<ExplorerNode> = {}): ExplorerNode {
    return {
        name: 'main.pas',
        path: '/tmp/main.pas',
        relativePath: 'main.pas',
        isDirectory: false,
        children: null,
        ...overrides,
    }
}

function dirNode(overrides: Partial<ExplorerNode> = {}): ExplorerNode {
    return {
        name: 'src',
        path: '/tmp/src',
        relativePath: 'src',
        isDirectory: true,
        children: [],
        ...overrides,
    }
}

describe('FileTreeNode', () => {
    it('renders a file node with its name', () => {
        const { getByText } = render(FileTreeNode, {
            props: {
                node: fileNode(),
                depth: 0,
                expandedPaths: new Set<string>(),
                onToggle: vi.fn(),
                onFileClick: vi.fn(),
            },
        })
        expect(getByText('main.pas')).toBeInTheDocument()
    })

    it('calls onFileClick with the node when a file row is clicked', async () => {
        const onFileClick = vi.fn()
        const node = fileNode()
        const { getByText } = render(FileTreeNode, {
            props: {
                node,
                depth: 0,
                expandedPaths: new Set<string>(),
                onToggle: vi.fn(),
                onFileClick,
            },
        })
        await fireEvent.click(getByText('main.pas'))
        expect(onFileClick).toHaveBeenCalledWith(node)
    })

    it('renders a directory node with a collapsed chevron by default', () => {
        const { getByText } = render(FileTreeNode, {
            props: {
                node: dirNode(),
                depth: 0,
                expandedPaths: new Set<string>(),
                onToggle: vi.fn(),
                onFileClick: vi.fn(),
            },
        })
        expect(getByText('▸')).toBeInTheDocument()
    })

    it('shows an expanded chevron and children when expanded', () => {
        const node = dirNode({
            children: [
                fileNode({ name: 'inner.pas', path: '/tmp/src/inner.pas' }),
            ],
        })
        const { getByText } = render(FileTreeNode, {
            props: {
                node,
                depth: 0,
                expandedPaths: new Set(['/tmp/src']),
                onToggle: vi.fn(),
                onFileClick: vi.fn(),
            },
        })
        expect(getByText('▾')).toBeInTheDocument()
        expect(getByText('inner.pas')).toBeInTheDocument()
    })

    it('calls onToggle with the node path when a directory row is clicked', async () => {
        const onToggle = vi.fn()
        const { getByText } = render(FileTreeNode, {
            props: {
                node: dirNode(),
                depth: 0,
                expandedPaths: new Set<string>(),
                onToggle,
                onFileClick: vi.fn(),
            },
        })
        await fireEvent.click(getByText('src'))
        expect(onToggle).toHaveBeenCalledWith('/tmp/src')
    })

    it('does not have the selected class when selectedPath does not match the node', () => {
        const { getByText } = render(FileTreeNode, {
            props: {
                node: fileNode(),
                depth: 0,
                expandedPaths: new Set<string>(),
                selectedPath: '/tmp/other.pas',
                onToggle: vi.fn(),
                onFileClick: vi.fn(),
            },
        })
        expect(getByText('main.pas').closest('button')?.className).not.toContain('selected')
    })

    it('has the selected class when selectedPath matches the file node path', () => {
        const node = fileNode()
        const { getByText } = render(FileTreeNode, {
            props: {
                node,
                depth: 0,
                expandedPaths: new Set<string>(),
                selectedPath: node.path,
                onToggle: vi.fn(),
                onFileClick: vi.fn(),
            },
        })
        expect(getByText('main.pas').closest('button')?.className).toContain('selected')
    })

    it('has the selected class when selectedPath matches the directory node path', () => {
        const node = dirNode()
        const { getByText } = render(FileTreeNode, {
            props: {
                node,
                depth: 0,
                expandedPaths: new Set<string>(),
                selectedPath: node.path,
                onToggle: vi.fn(),
                onFileClick: vi.fn(),
            },
        })
        expect(getByText('src').closest('button')?.className).toContain('selected')
    })

    it('calls onContextMenu with the node and pointer coordinates on right-click of a file row', async () => {
        const onContextMenu = vi.fn()
        const node = fileNode()
        const { getByText } = render(FileTreeNode, {
            props: {
                node,
                depth: 0,
                expandedPaths: new Set<string>(),
                onToggle: vi.fn(),
                onFileClick: vi.fn(),
                onContextMenu,
            },
        })
        await fireEvent.contextMenu(getByText('main.pas'), { clientX: 42, clientY: 84 })
        expect(onContextMenu).toHaveBeenCalledWith(node, 42, 84)
    })

    it('calls onContextMenu with the node and pointer coordinates on right-click of a directory row', async () => {
        const onContextMenu = vi.fn()
        const node = dirNode()
        const { getByText } = render(FileTreeNode, {
            props: {
                node,
                depth: 0,
                expandedPaths: new Set<string>(),
                onToggle: vi.fn(),
                onFileClick: vi.fn(),
                onContextMenu,
            },
        })
        await fireEvent.contextMenu(getByText('src'), { clientX: 5, clientY: 9 })
        expect(onContextMenu).toHaveBeenCalledWith(node, 5, 9)
    })

    it('calls onFileClick when Enter is pressed on a focused file row', async () => {
        const onFileClick = vi.fn()
        const node = fileNode()
        const { getByText } = render(FileTreeNode, {
            props: {
                node,
                depth: 0,
                expandedPaths: new Set<string>(),
                onToggle: vi.fn(),
                onFileClick,
            },
        })
        await fireEvent.keyDown(getByText('main.pas'), { key: 'Enter' })
        expect(onFileClick).toHaveBeenCalledWith(node)
    })

    it('calls onToggle when Enter is pressed on a focused directory row', async () => {
        const onToggle = vi.fn()
        const node = dirNode()
        const { getByText } = render(FileTreeNode, {
            props: {
                node,
                depth: 0,
                expandedPaths: new Set<string>(),
                onToggle,
                onFileClick: vi.fn(),
            },
        })
        await fireEvent.keyDown(getByText('src'), { key: 'Enter' })
        expect(onToggle).toHaveBeenCalledWith('/tmp/src')
    })

    it('does not call onFileClick/onToggle for a key other than Enter', async () => {
        const onToggle = vi.fn()
        const onFileClick = vi.fn()
        const { getByText } = render(FileTreeNode, {
            props: {
                node: fileNode(),
                depth: 0,
                expandedPaths: new Set<string>(),
                onToggle,
                onFileClick,
            },
        })
        await fireEvent.keyDown(getByText('main.pas'), { key: 'a' })
        expect(onFileClick).not.toHaveBeenCalled()
        expect(onToggle).not.toHaveBeenCalled()
    })

    it('prevents the default action when Enter activates a row', async () => {
        const node = fileNode()
        const { getByText } = render(FileTreeNode, {
            props: {
                node,
                depth: 0,
                expandedPaths: new Set<string>(),
                onToggle: vi.fn(),
                onFileClick: vi.fn(),
            },
        })
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
        getByText('main.pas').dispatchEvent(event)
        expect(event.defaultPrevented).toBe(true)
    })
})