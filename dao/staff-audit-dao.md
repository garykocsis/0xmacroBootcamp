https://github.com/Hacker-DAO/student.gkocsis4200/tree/9e7b33cac8335702a21d42f3be4b8a095e817324/dao

The following is a micro audit by Alex S.


## General Comments

Nice work, well thought through. The tests are also good.

## Design Exercise

For question 1 it would be good to have some more detail on how you envision this working. In question 2 you are right that cycles are a new problem to consider once transitive vote delegation is added.

## issue-1

**[High]** `buyPriceless` is vulnerable to a re-entrancy attack

In CollecterDao.sol at lines 233 and 235 the `buyPriceless` function calls the marketplace contract. A malicious contract could call back into the `buyPribceless` function requesting the purchase of other NFTs at any price, potentially draining the CollectorDao contract of all funds. 

## issue-2

**[Code Quality]** `castVoteByBulk` is fragile

If any of the votes are invalid then the entire batch is reverted.

## Nitpick

The test for `buyPriceless` should really verify the transfer of NFT ownership and the price paid (by comparing before and after balances) once the proposal execution is complete.

## Score

| Reason | Score |
|-|-|
| Late                       |  - |
| Unfinished features        |  - |
| Extra features             |  - |
| Vulnerability              |  3 |
| Unanswered design exercise |  - |
| Insufficient tests         |  - |
| Technical mistake          |  - |

Total: 3

Good job!




