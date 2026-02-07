  

## **Place + Time Query (your rule)**

- After any location resolution, apply Temporal Window (±3 or configurable)

  

## **Time + Place Query**

- After temporal resolution, constrain to spatial subtree

  

## **Spacetime Neighborhood**

- Combine: spatial neighbor set (4/6/26) at time t, then apply ±N time
- Output: a small “block” of voxels in spacetime

  

## **Spacetime Path Walk**

- Rule: alternate steps: temporal neighbor then spatial neighbor (or vice versa)
- Useful for “what led here?” / “what spread from here?”