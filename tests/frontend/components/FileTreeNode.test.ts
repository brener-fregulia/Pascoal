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
})