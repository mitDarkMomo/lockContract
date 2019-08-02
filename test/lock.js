const Lock = artifacts.require("Lock");

contract('Lock', (accounts) => {
    const months3 = 3;
    const months6 = 6;
    const months12 = 12;
    const day = 60*60*24;
  
    it('lock period should be 3,6,12', async () => {
        const lockInstance = await Lock.deployed();

        
        const monthsX = 10;

        const rate = 4;

        try{
            await lockInstance.applyQuota(monthsX, rate, {value: web3.utils.toWei('1', 'ether')});
        }catch(error) {
            assert.include(error.toString(), "revert", "lock period error, tx reverted");
        }

        try{
            await lockInstance.applyQuota(months3, rate, {value: web3.utils.toWei('1', 'ether')});
            await lockInstance.applyQuota(months6, rate, {value: web3.utils.toWei('1', 'ether')});
            await lockInstance.applyQuota(months12, rate, {value: web3.utils.toWei('1', 'ether')});
        }catch(error) {
            assert(false);
        }
    });

    it('rate should be less than 100', async () => {
        const lockInstance = await Lock.deployed();

        let rate = 101;

        try{
            await lockInstance.applyQuota(months3, rate, {value: web3.utils.toWei('1', 'ether')});
        }catch(error) {
            assert.include(error.toString(), "revert", "rate error, tx reverted");
        }

        rate = 10;
        try{
            await lockInstance.applyQuota(months3, rate, {value: web3.utils.toWei('1', 'ether')});
        }catch(error) {
            assert(false);
        }
    });

    it('value should be grater than 0', async () => {
        const lockInstance = await Lock.deployed();

        let rate = 10;

        try{
            await lockInstance.applyQuota(months3, rate);
        }catch(error) {
            assert.include(error.toString(), "revert", "value error, tx reverted");
        }
    });
  
    it('_amountPerMonth, _nextPayTime, _unlockTime should be correct', async () => {
        const lockInstance = await Lock.deployed();

        let rate = 12;

        await lockInstance.applyQuota(months3, rate, {value: web3.utils.toWei('100', 'ether')});
        let lockInfo = await lockInstance.pays.call(accounts[0]);
        assert.equal(web3.utils.fromWei(lockInfo[0]), 1, "amountPerMonth should be 1");
        assert.equal(web3.utils.fromWei(lockInfo[4]), 100, "capital should be 100 ether");
    });

    it('to address should not be 0', async () => {
        const lockInstance = await Lock.deployed();

        try{
            await lockInstance.withdraw('0x0000000000000000000000000000000000000000');
        }catch(error) {
            assert.include(error.toString(), "revert", "to address error, tx reverted");
        }
    });

    it('fromAddr should have applied for quota or be in lock time', async () => {
        const lockInstance = await Lock.deployed();

        try{
            await lockInstance.withdraw(accounts[0]);
        }catch(error) {
            assert.include(error.toString(), "revert", "from address error, tx reverted");
        }
    });

    it('withdraw correctly', async () => {
        const lockInstance = await Lock.deployed();
        
        const rate = 12;
        await lockInstance.applyQuota(months3, rate, {value: web3.utils.toWei('10', 'ether')});
        
        // let balanceBefore = await web3.eth.getBalance(accounts[1]);
        // // let balanceBefore = web3.utils.toBN(web3.utils.toWei('1500', 'ether'))
        // await lockInstance.withdraw(accounts[1]);
        // let balanceAfter = await web3.eth.getBalance(accounts[1]);
        // assert.deepEqual(balanceBefore, balanceAfter, "not time for withdraw yet");

        // 30 days later
        let passby = day * 90;
        await web3.currentProvider.send({
            jsonrpc: "2.0", 
            method: "evm_increaseTime", 
            params: [passby], 
            id: 0
        });
        await web3.currentProvider.send({
            jsonrpc: "2.0", 
            method: "evm_mine", 
            params: [], 
            id: 0
        });
        
        try{
            await lockInstance.withdraw(accounts[1]);
        }catch(error) {

        }

        // assert.deepEqual(balanceBefore, balanceAfter, "should withdraw a month interest");
    });

});
