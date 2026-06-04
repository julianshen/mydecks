import type { ElementContent, ElementStyle } from '@/types';

interface Props {
  content: ElementContent;
  style: ElementStyle;
  /** Pixels-per-slide-unit: `zoom` on the editor canvas, `scale` in previews. */
  scale: number;
}

/**
 * Renders a table element's `tableData` (a 2-D array of cell strings) as a
 * fixed-layout HTML table that fills its element box. Shared by the editor
 * canvas (`SlideElementView`) and the presenter/preview renderer (`SlideView`)
 * so a table looks identical everywhere. The first row is treated as a header.
 */
export default function TableElement({ content, style, scale }: Props) {
  const data = content.tableData?.length ? content.tableData : [['']];
  const border = `${Math.max(0.5, (style.borderWidth ?? 1) * scale)}px solid ${style.borderColor || '#d1d5db'}`;

  return (
    <table
      style={{
        width: '100%',
        height: '100%',
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
        fontSize: (style.fontSize || 14) * scale,
        fontFamily: style.fontFamily || 'Arial',
        color: style.color || '#1a1a1a',
        background: style.backgroundColor || '#ffffff',
        opacity: style.opacity ?? 1,
      }}
    >
      <tbody>
        {data.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) => (
              <td
                key={c}
                style={{
                  border,
                  padding: `${4 * scale}px ${8 * scale}px`,
                  textAlign: (style.textAlign || 'left') as React.CSSProperties['textAlign'],
                  fontWeight: r === 0 ? 'bold' : (style.fontWeight || 'normal'),
                  background: r === 0 ? 'rgba(0,0,0,0.04)' : undefined,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
