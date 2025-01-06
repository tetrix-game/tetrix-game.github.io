
export default function Tetrix({ board }: { board: number[] }) {
  // The window tells us whether the game should be vertical or horizontal by checking if the window's width is greater than its height
  // We can also use the window's orientation to determine this

  return (
    <div style={{ width: '80vw', height: '80vh', position: 'relative' }}>
      {board.map((blockValues, index) => {
        return (
          <Block
            key={index}
            index={index}
            values={blockValues}
            small={false}
          />
        )
      })}
    </div>
  )
}

export function Block({
  index,
  values,
  small,
}: {
  index: number,
  values: { filled: number, color: string },
  small: boolean,
}) {

  const unit = window.innerWidth > window.innerHeight ? 'vh' : 'vw';
  const y = Math.floor(index / 8);
  const x = index % 8;

  let opacity = 0;

  const isFilledByBlock = values.filled === 2;
  const isEmptyOnSmallBlock = values.filled === 0 && small;
  const isHoveredBlock = values.filled === 1;
  const isEmptyGridCell = values.filled === 0 && !small;
  const isValidBlockPlacement = values.filled === 3;

  if (isFilledByBlock || isValidBlockPlacement) opacity = 1;
  if (isEmptyOnSmallBlock) opacity = 0;
  if (isHoveredBlock) opacity = 0.2;
  if (isEmptyGridCell) opacity = 1;

  const backgroundColor = `rgba(${values.color}, ${opacity})`;

  return (
    <div
      style={{
        position: "absolute",
        top: small ? y * 2 + unit : y * 12.5 + unit,
        left: small ? x * 2 + unit : x * 12.5 + unit,
        width: small ? '2' + unit : '12.5' + unit,
        height: small ? '2' + unit : '12.5' + unit,
        backgroundColor: backgroundColor,
        border: `2px solid ${small && !opacity ? 'rgba(0, 0, 0, 0)' : 'black'}`,
        // A MUCH nicer border look would be to use a box-shadow instead of a border
        boxSizing: 'border-box'
      }}
    />
  );
}
