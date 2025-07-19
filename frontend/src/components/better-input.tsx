import {
    InputBase,
    InputBaseAdornment,
    InputBaseControl,
    InputBaseInput,
} from "@/components/ui/input-base";

interface BetterInputProps {
    prefixAdornment?: React.ReactNode;
    postAdornment?: React.ReactNode;
    type?: React.HTMLInputTypeAttribute;
    placeholder?: string;
    props?: React.ComponentProps<"input">;
    step?: string | number;
    disabled?: boolean;
    defaultValue?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BetterInput(fields: BetterInputProps) {
    return (
        <InputBase>
            {fields.prefixAdornment && (
                <InputBaseAdornment>
                    {fields.prefixAdornment}
                </InputBaseAdornment>
            )}
            <InputBaseControl>
                <InputBaseInput {...fields.props} type={fields.type} placeholder={fields.placeholder} onChange={fields.onChange} step={fields.step} defaultValue={fields.defaultValue} disabled={fields.disabled} />
            </InputBaseControl>
            {fields.postAdornment && (
                <InputBaseAdornment>
                    {fields.postAdornment}
                </InputBaseAdornment>
            )}
        </InputBase>
    );
}