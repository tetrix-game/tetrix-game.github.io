import { cloneDeep } from "lodash";
import React from "react";

const COLORS = {
  LIME: '0, 255, 0',
  YELLOW: '255, 165, 0',
  BLUE: '0, 0, 255',
  GREEN: '0, 128, 0',
  BLACK: '0, 0, 0',
  RED: '255, 0, 0',
  PURPLE: '128, 0, 128',
  GREY: '128, 128, 128',
  BROWN: '165, 42, 42',
}

const _ = false;
const X = true;
// Shapes for Tetris (no rotations are allowed by the player, but all shape rotations are allowed here)
const SHAPES = [
  {
    shape:
      [
        [X, _],
        [X, _],
        [X, X],
      ],
    color: COLORS.PURPLE
  },
  {
    shape:

      [
        [X, X, X],
        [X, _, _],
      ],
    color: COLORS.PURPLE
  },
  {
    shape:
      [
        [X, X],
        [_, X],
        [_, X],
      ],
    color: COLORS.PURPLE
  },
  {
    shape:

      [
        [_, _, X],
        [X, X, X],
      ],
    color: COLORS.PURPLE
  },
  {
    shape:

      [
        [X, X, X],
        [_, X, _],
      ],
    color: COLORS.BROWN
  },
  {
    shape:

      [
        [_, X, _],
        [X, X, X],
      ],
    color: COLORS.BROWN
  },
  {
    shape:
      [
        [X, _],
        [X, X],
        [X, _],
      ],
    color: COLORS.BROWN
  },
  {
    shape:
      [
        [_, X],
        [X, X],
        [_, X],
      ],
    color: COLORS.BROWN
  },
  {
    shape:
      [
        [_, X],
        [X, X],
        [X, _],
      ],
    color: COLORS.RED
  },
  {
    shape:
      [
        [X, X, _],
        [_, X, X],
      ],
    color: COLORS.RED
  },
  {
    shape:
      [
        [_, X],
        [_, X],
        [X, X],
      ],
    color: COLORS.BLUE
  },
  {
    shape:
      [
        [X, _, _],
        [X, X, X],
      ],
    color: COLORS.BLUE
  },
  {
    shape:
      [
        [X, X],
        [X, _],
        [X, _],
      ],
    color: COLORS.BLUE
  },
  {
    shape:
      [
        [X, X, X],
        [_, _, X],
      ],
    color: COLORS.BLUE
  },
  {
    shape:
      [
        [_, X, X],
        [X, X, _],
      ],
    color: COLORS.GREEN
  },
  {
    shape:
      [
        [X, _],
        [X, X],
        [_, X],
      ],
    color: COLORS.GREEN
  },
  {
    shape:
      [
        [X, X],
        [X, X],
      ],
    color: COLORS.YELLOW
  },
  {
    shape:
      [
        [X, X, X],
        [X, X, X],
        [X, X, X],
      ],
    color: COLORS.BLACK
  },
  {
    shape:
      [
        [X],
      ],
    color: COLORS.LIME
  },
  {
    shape:
      [
        [X],
        [X],
        [X],
        [X],
      ],
    color: COLORS.GREY
  },
  {
    shape:
      [
        [X, X, X, X],
      ],
    color: COLORS.GREY
  },
]
export type Shape = { shape: boolean[][], color: string, hasBeenRotated?: boolean };
export default function useShapeSet({ shapeFits }: { shapeFits: (shape: boolean[][]) => boolean }) {

  const randomShape = React.useCallback((): Shape => {
    const proposeShape = () => SHAPES[Math.floor(Math.random() * SHAPES.length)];
    let returnShape = proposeShape();
    do {
      returnShape = proposeShape();
    } while (!shapeFits(returnShape.shape));
    return returnShape;
  }, [shapeFits]);

  const [shapes, setShapes] = React.useState({
    first: randomShape(),
    second: randomShape(),
    third: randomShape(),
  })

  const takeShape = (shapePlace: keyof typeof shapes): Shape => {
    if (shapes[shapePlace] === undefined) throw new Error('No shape to use');
    const returnShape = shapes[shapePlace];
    setShapes((prev) => {
      const newShapes = { ...prev, [shapePlace]: null }
      if (newShapes.first === null && newShapes.second === null && newShapes.third === null) {
        newShapes.first = randomShape();
        newShapes.second = randomShape();
        newShapes.third = randomShape();
      }
      return newShapes;
    });
    return returnShape;
  }

  const peekShape = (shapePlace: keyof typeof shapes): Shape | null => {
    if (shapes[shapePlace] === undefined) return null;
    return shapes[shapePlace];
  }

  const turnShape = (shapePlace: keyof typeof shapes, setPoints: (points: number) => void): void => {
    if (shapes[shapePlace] === undefined) return;

    setShapes((prev) => {
      const newShapes = cloneDeep(prev);
      const paymentIsRequired = !shapes[shapePlace].hasBeenRotated;

      if (paymentIsRequired) setPoints((prev: number) => prev - 10);

      newShapes[shapePlace] = {
        shape: shapes[shapePlace].shape[0].map((_, i) => shapes[shapePlace].shape.map(row => row[i])).reverse(),
        color: shapes[shapePlace].color,
        hasBeenRotated: true,
      };

      return newShapes;
    });
  }

  return { shapes, takeShape, peekShape, turnShape };
}
