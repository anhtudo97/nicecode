import "opentui-spinner/react"
import { useTheme } from "@/providers/theme"
import { Mode } from "@nicecode/database/enums"

type Props = {
    mode?: Mode
}

export const Spinner = ({ mode }: Props) => {
    const { colors } = useTheme()
    const activeColor = mode === Mode.PLAN ? colors.planMode : colors.primary

    return <spinner name="aesthetic" color={activeColor} />
}
