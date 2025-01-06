import { Block } from './Tetrix'
import { Shape } from './useShapeSet'

const upNextContainerCss = (focused) => {
  return {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: "min(25vw, 25vh)",
    minHeight: 'min(25vw, 25vh)',
    backgroundColor: 'whitesmoke',
    borderRadius: '50%',
    border: focused ? '2px solid black' : '2px solid transparent',
  }
}

const forCenterting = {
  position: 'absolute',
  top: '40%',
  left: '40%',
  transform: 'translate(-50%, -50%)',
}

export default function UpNext({ shape, shapePlace, setFocusedShape, focusedShape }: { shape: Shape, shapePlace: string, setFocusedShape: (shape: string) => void, focusedShape: string }) {
  if (shape === null) {
    return <div style={upNextContainerCss(focusedShape === shapePlace)}
    />;
  }
  return (
    <div
      onTouchStart={() => setFocusedShape(shapePlace)}
      onClick={(e) => {
        e.stopPropagation();
        setFocusedShape(shapePlace)
      }}
      style={upNextContainerCss(focusedShape === shapePlace)}
    >
      <div style={forCenterting}>
        {shape.shape.map((row, rowIndex) => {
          return (
            row.map((shouldFill, blockIndex) => {
              return (
                <Block small key={blockIndex} index={rowIndex * 8 + blockIndex} values={{ filled: shouldFill ? 2 : 0, color: shape.color }} />
              )
            })
          )
        })}
      </div>
    </div>
  )
}
