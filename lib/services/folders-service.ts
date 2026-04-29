import type { NeuralFolder, NeuralFolderTreeNode, NeuralNote } from "@/lib/types";
import { classificationService } from "@/lib/services/classification-service";

function makeFolderId(path: string) {
  return `folder:${classificationService.slugify(path)}`;
}

function notePathForFolder(folderPath: string) {
  const segments = folderPath.split("/").filter(Boolean);
  const noteName = segments[segments.length - 1] || folderPath;
  return `${folderPath}/${noteName}.md`;
}

export const foldersService = {
  notePathForFolder,
  ensureFolder(folders: NeuralFolder[], folderPath: string, parentPath: string | null) {
    const existingFolder = folders.find((folder) => folder.path === folderPath);
    if (existingFolder) {
      return folders.map((folder) => {
        if (folder.path === parentPath && !folder.childPaths.includes(folderPath)) {
          return { ...folder, childPaths: [...folder.childPaths, folderPath].sort() };
        }

        return folder;
      });
    }

    const segments = folderPath.split("/").filter(Boolean);
    const folderName = segments[segments.length - 1] || folderPath;
    const nextFolder: NeuralFolder = {
      id: makeFolderId(folderPath),
      name: folderName,
      slug: classificationService.slugify(folderName),
      path: folderPath,
      depth: segments.length,
      parentPath,
      notePath: notePathForFolder(folderPath),
      childPaths: [],
    };

    const updatedFolders = [...folders, nextFolder];

    return updatedFolders.map((folder) => {
      if (folder.path === parentPath && !folder.childPaths.includes(folderPath)) {
        return { ...folder, childPaths: [...folder.childPaths, folderPath].sort() };
      }

      return folder;
    });
  },
  buildTree(folders: NeuralFolder[], notes: NeuralNote[]): NeuralFolderTreeNode[] {
    const noteMap = new Map(notes.map((note) => [note.path, note]));
    const nodeMap = new Map<string, NeuralFolderTreeNode>();

    for (const folder of folders) {
      nodeMap.set(folder.path, {
        folder,
        note: noteMap.get(folder.notePath),
        children: [],
      });
    }

    const roots: NeuralFolderTreeNode[] = [];

    for (const folder of folders) {
      const node = nodeMap.get(folder.path);
      if (!node) {
        continue;
      }

      if (folder.parentPath) {
        const parentNode = nodeMap.get(folder.parentPath);
        parentNode?.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const sortNode = (node: NeuralFolderTreeNode) => {
      node.children.sort((first, second) => first.folder.name.localeCompare(second.folder.name));
      node.children.forEach(sortNode);
      return node;
    };

    return roots.sort((first, second) => first.folder.name.localeCompare(second.folder.name)).map(sortNode);
  },
  flattenFolderScope(folderPath: string, folders: NeuralFolder[]) {
    const scopedPaths = new Set<string>();
    const visit = (path: string) => {
      scopedPaths.add(path);
      const children = folders.find((folder) => folder.path === path)?.childPaths || [];
      children.forEach(visit);
    };

    visit(folderPath);
    return scopedPaths;
  },
};

