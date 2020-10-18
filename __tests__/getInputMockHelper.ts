import * as core from '@actions/core';

export function getInputMock(core, inputs: Map<string, string>) {

    return jest.spyOn(core, 'getInput').mockImplementation((name, options): string => {

        if (inputs.has(name as string)) {
            return inputs.get(name as string) as string
        }

        if (options && (options as core.InputOptions).required) {
            throw new Error('Input required and not supplied: missing')
        }

        return '';
    });
}