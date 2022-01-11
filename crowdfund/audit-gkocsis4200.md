# Crowdfundr Audit 

## issue-1

[low] Contributor will be re-awarded badges after they have transferred badges

On line 164, Crowdfundr.sol has the following code

    uint currentTotal = balanceOf(msg.sender);

This code gets their number of badges, so if they transfer a badge, it will show less badges than they have actually been awarded.

Consider: keeping track of how many badges were awarded to a contributor.


Nitpick items

instead of using 1000000000000000000 use 1e18
so, line 159 could be uint totalNeeded = contributions[msg.sender] / 1e18;

No need to check in node_modules, cache, and artifacts into git