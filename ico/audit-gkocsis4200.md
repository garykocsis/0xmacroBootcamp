# Issues

## Issue-1

[Medium] Anyone can add `allowList`

```
function addAllowList(address[] memory _allowList) external {
    require(phase == Phase.Seed,"NOT SEED PHASE");
    address[] memory allowAddresses = _allowList;

// add to mapping with indicator true
    for (uint i = 0; i < _allowList.length; i++) {
        allowList[allowAddresses[i]] = true;
    }
}
```

`msg.sender` should be checked if the sender is the owner or entitled to add the list.

# Code Quality

[1]

```
require(allowList[msg.sender] == true,"NOT ON ALLOW LIST");
```

You don't need to express `== true` clearly.

```
require(allowList[msg.sender], "NOT ON ALLOW LIST");
```

[2]

```
function nextPhase() external onlyOwner()
function setPaused(bool _paused) external onlyOwner()
```

You don't need to write `()` if there is no param.

```
function nextPhase() external onlyOwner
function setPaused(bool _paused) external onlyOwner
```
