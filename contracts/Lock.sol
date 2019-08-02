pragma solidity ^0.5.1;

import "./SafeMath.sol";

contract Lock {
    using SafeMath for uint256;
    
    struct lockInfo {
        uint256 _amountPerMonth;
        uint256 _nextPayTime;
        uint256 _unlockTime;
        uint256 _amountToWithdraw;
        uint256 _capital;
        uint256 _months;
        uint256 _rate;
    }
    
    mapping (address => lockInfo) public pays;
    
    address owner;
    
    modifier onlyOwner {
        require (msg.sender == owner, "OnlyOwner methods called by non-owner.");
        _;
    }
    
    constructor() public payable {
        owner = msg.sender;
    }
    
    /**
     * @dev accept apply & set amount/month, next pay time, rate and unlock time
     */
    function applyQuota(uint256 months, uint256 rate) external payable {
        require(msg.value > 0, "only accept money > 0");
        require(months == 3 || months == 6 || months == 12, "lock period should be 3,6,12");
        require(rate < 100, "rate should be less than 100");

        uint256 amountPerMonth = msg.value.mul(rate).div(100).div(12);
        uint256 unlockTime = now.add(months.mul(30 days));
        uint256 nextPayTime = now.add(30 days);
        
        pays[msg.sender]._amountPerMonth = amountPerMonth;
        pays[msg.sender]._nextPayTime = nextPayTime;
        pays[msg.sender]._unlockTime = unlockTime;
        pays[msg.sender]._capital = msg.value;
        pays[msg.sender]._months = months;
        pays[msg.sender]._rate = rate;
    }
    
    /**
     * @dev caculate the amount to withdraw and transfer to specified address
     */ 
     function withdraw(address payable toAddr) external onlyOwner {
         require(toAddr != address(0), "toAddr should not be 0");
         require(pays[msg.sender]._amountPerMonth > 0, "fromAddr should have applied for quota or be in lock time");
         
         calAmount(msg.sender);
         
         uint256 amount = pays[msg.sender]._amountToWithdraw;
         pays[msg.sender]._amountToWithdraw = 0;
         
         if(pays[msg.sender]._nextPayTime > pays[msg.sender]._unlockTime) {
             amount = amount.add(pays[msg.sender]._capital);
             delete pays[msg.sender];
         }
         if(amount > 0) {
            toAddr.transfer(amount);
         }
     }
     
     /**
      * @dev calculate amount to withdraw by specified address
      */ 
     function calAmount(address addr) internal {
         while(pays[addr]._nextPayTime <= now && pays[addr]._nextPayTime <= pays[addr]._unlockTime) {
             pays[addr]._amountToWithdraw = pays[addr]._amountToWithdraw.add(pays[addr]._amountPerMonth);
             pays[addr]._nextPayTime = pays[addr]._nextPayTime.add(30 days);
         }
     }
}