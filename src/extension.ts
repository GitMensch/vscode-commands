import { ExtensionContext, window, workspace } from 'vscode';
import { updateCommandPalette } from './commandPalette';
import { registerExtensionCommands } from './commands';
import { updateDocumentLinkProvider } from './documentLinksProvider';
import { updateUserCommands } from './registerUserCommands';
import { updateStatusBarItems } from './statusBar';
import { CommandsTreeViewProvider } from './TreeViewProvider';
import { ExtensionConfig, Runnable, TopLevelCommands } from './types';
import { addWorkspaceIdToCommands, getWorkspaceId, setWorkspaceIdToContext } from './workspaceCommands';

export const enum Constants {
	extensionId = 'usernamehw.commands',
	extensionName = 'commands',
	commandsSettingId = 'commands.commands',
	workspaceCommandsSettingId = 'commands.workspaceCommands',
	treeViewStatusBarIndicator = '💠',

	COMMAND_PALETTE_WAS_POPULATED_STORAGE_KEY = 'was_populated',
}

export let extensionConfig: ExtensionConfig;
export class extensionState {
	static lastExecutedCommand: Runnable = { command: 'noop' };
	static extensionContext: ExtensionContext;
}

export async function activate(extensionContext: ExtensionContext) {
	extensionState.extensionContext = extensionContext;

	updateConfig();

	const commandsTreeViewProvider = new CommandsTreeViewProvider({});
	const commandsTreeView = window.createTreeView(`${Constants.extensionName}.tree`, {
		treeDataProvider: commandsTreeViewProvider,
		showCollapseAll: true,
	});


	registerExtensionCommands();

	await setWorkspaceIdToContext(extensionContext);
	updateEverything(getWorkspaceId(extensionContext));

	function updateConfig() {
		extensionConfig = workspace.getConfiguration(Constants.extensionName) as any as ExtensionConfig;
	}

	function updateEverything(workspaceId?: string) {
		const commands = allCommands(workspaceId);
		commandsTreeViewProvider.updateCommands(commands);
		commandsTreeViewProvider.refresh();
		updateUserCommands(commands);
		updateStatusBarItems(commands);
		updateCommandPalette(commands, extensionContext);
		updateDocumentLinkProvider();
	}

	extensionContext.subscriptions.push(commandsTreeView);
	extensionContext.subscriptions.push(workspace.onDidChangeConfiguration(e => {
		if (!e.affectsConfiguration(Constants.extensionName)) {
			return;
		}
		updateConfig();
		updateEverything(getWorkspaceId(extensionContext));
	}));
}

/** Merge global and workspace commands */
export function allCommands(workspaceId: string | undefined): TopLevelCommands {
	const workspaceCommands = workspace.getConfiguration(Constants.extensionName).inspect('workspaceCommands')?.workspaceValue as ExtensionConfig['workspaceCommands'] | undefined;
	if (workspaceId && workspaceCommands) {
		return {
			...extensionConfig.commands,
			...addWorkspaceIdToCommands(workspaceCommands, workspaceId),
		};
	} else {
		return extensionConfig.commands;
	}
}

export function deactivate() { }
