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
        uint256 _totalAmount;
        uint256 _months;
        uint256 _rate;
    }
    
    mapping (address => lockInfo) public pays;
    mapping (uint256 => mapping(uint256 => uint256)) public rates;    //uint256 => uint256 => uint256;

    uint256 private _totalCapital;  //total capital locked in contract
    uint256 private _addressCount;  //the count of addresses locked in contract
    
    address private _owner;
    address private _nextOwner;
    
    modifier onlyOwner {
        require (msg.sender == _owner, "OnlyOwner methods called by non-owner.");
        _;
    }

    modifier onlyNextOwner {
        require (msg.sender == _nextOwner, "OnlyNextOwner methods called by non-nextOwner.");
        _;
    }
    
    constructor() public payable {
        _owner = msg.sender;

        rates[3][0] = 250;  // X < 100W
        rates[3][1] = 275;  // 100W <= X < 1000W
        rates[3][2] = 325;  // X >= 1000W

        rates[6][0] = 275;  // X < 100W
        rates[6][1] = 300;  // 100W <= X < 1000W
        rates[6][2] = 350;  // X >= 1000W

        rates[12][0] = 325; // X < 100W
        rates[12][1] = 350; // 100W <= X < 1000W
        rates[12][2] = 400; // X >= 1000W
    }

    function () external payable {

    }
    
    /**
     * @dev accept apply & set amount/month, next pay time, rate and unlock time
     */
    function applyQuota(uint256 months, uint256 rate) external payable {
        require(msg.value > 0, "only accept money > 0");
        require(rates[months][0] > 0, "lock period should be in range");
        require(pays[msg.sender]._unlockTime == 0, "one address should lock only once");
        
        //verify rate consistence
        require(rate < 10000, "rate should be less than 10000");
        if(msg.value < 1000000 ether) {
            require(rate == rates[months][0], "Inconsistent interest rates");
        }else if(1000000 ether <= msg.value && msg.value < 10000000 ether) {
            require(rate == rates[months][1], "Inconsistent interest rates");
        }else {
            require(rate == rates[months][2], "Inconsistent interest rates");
        }

        uint256 totalRate = msg.value.mul(rate).div(10000);
        uint256 amountPerMonth = totalRate.div(12);
        uint256 unlockTime = now.add(months.mul(30 days));
        uint256 nextPayTime = now.add(30 days);
        
        pays[msg.sender]._amountPerMonth = amountPerMonth;
        pays[msg.sender]._nextPayTime = nextPayTime;
        pays[msg.sender]._unlockTime = unlockTime;
        pays[msg.sender]._capital = msg.value;
        pays[msg.sender]._totalAmount = totalRate.add(msg.value);
        pays[msg.sender]._months = months;
        pays[msg.sender]._rate = rate;

        _totalCapital = _totalCapital.add(msg.value);
        _addressCount = _addressCount.add(1);
    }
    
    /**
     * @dev caculate the amount to withdraw and transfer to specified address
     */ 
    function withdraw(address payable toAddr) external{
        require(toAddr != address(0), "toAddr should not be 0");
        require(pays[msg.sender]._amountPerMonth > 0, "fromAddr should have applied for quota or be in lock time");
        
        _calAmount(msg.sender);
        
        uint256 amount = pays[msg.sender]._amountToWithdraw;
        pays[msg.sender]._amountToWithdraw = 0;
        pays[msg.sender]._totalAmount = pays[msg.sender]._totalAmount.sub(amount);
        
        if(pays[msg.sender]._nextPayTime > pays[msg.sender]._unlockTime) {
            _totalCapital = _totalCapital.sub(pays[msg.sender]._capital);
            _addressCount = _addressCount.sub(1);
            delete pays[msg.sender];
        }
        if(amount > 0) {
            require(amount <= address(this).balance, "not enough balance to transfer");
            toAddr.transfer(amount);
        }
    }

    /**
     * @dev set rate    
     */
    function setRate(uint256 month, uint256 flag0, uint256 flag1, uint256 flag2) external onlyOwner {
        rates[month][0] = flag0;
        rates[month][1] = flag1;
        rates[month][2] = flag2;
    }

    /**
     * return total capital locked in contract
     */
    function totalCapital() external view returns (uint256) {
        return _totalCapital;
    }

    /**
     * return address count locked in contract
     */
    function addressCount() external view returns (uint256) {
        return _addressCount;
    }

    /**
     * return the total amount to be withdraw & the amount can be withdrawn now
     */
    function getBalanceInfo(address addr) external returns (uint256, uint256) {
        _calAmount(addr);
        return (pays[msg.sender]._totalAmount, pays[msg.sender]._amountToWithdraw);
    }
     
    function balance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    function withdrawByOwner() external onlyOwner {
        msg.sender.transfer(address(this).balance);
    }

    /**
     * ready to deliver owner  
     */
    function startDeliverOwner(address payable nextOwner) external onlyOwner {
        require(nextOwner != address(0), "next owner's address should not be 0x0");
        _nextOwner = nextOwner;
    }

    /**
     * declare ownership 
     */
    function declareOwner() external onlyNextOwner {
        _owner = _nextOwner;
        delete _nextOwner;
    }

    /**
     * view owner
     */
    function owner() external view returns (address) {
        return _owner;
    }
    
    /**
    * @dev calculate amount to withdraw by specified address
    */ 
    function _calAmount(address addr) internal {
        while(pays[addr]._nextPayTime <= now && pays[addr]._nextPayTime <= pays[addr]._unlockTime) {
            pays[addr]._amountToWithdraw = pays[addr]._amountToWithdraw.add(pays[addr]._amountPerMonth);
            pays[addr]._nextPayTime = pays[addr]._nextPayTime.add(30 days);
        }

        if(pays[msg.sender]._nextPayTime > pays[msg.sender]._unlockTime) {
            pays[msg.sender]._amountToWithdraw = pays[msg.sender]._amountToWithdraw.add(pays[msg.sender]._capital);
        }
    }
}