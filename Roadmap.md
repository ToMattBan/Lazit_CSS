# LazIt Roadmap

Before the roadmap itself, i want to explain what is Lazit, how I intended it to work and why I'm creating it

### What is LazIt?

- Lazit is a CSS library that consist of utility classes to help us to write CSS without custom classes
- It is fully customizable, each dev can have one version of lazit

### How it work?

- Lazit will have an config file, writted as a JSON, where the dev can customize it's experience
- Lazit will read this JSON, pass its configs to our SASS and then it will build a single custom CSS file
- Lazit will be builded with "modules" that can be enabled or disabled, based on what the dev wants
- All this using the power of SASS

### Why I'm creating it?

- Very early in my carrer, I discovered bootstrap and then I learned boostrap.
- After some months, I got a project where I couldn't use bootstrap and I discovered that I didn't really knew how CSS worked.
- So, I decided to never again use a CSS framework like bootstrap.
- But write custom classes to every element are very tiring and time-consuming, so I needed a solution
- The soluion was utillity classes, someting amazin. But none of the libs I found really did the work, until I was presented to MyIt
- Lazit is just the successor of MyIt.

### Why not Tailwind?

- I dislike two things in tailwind: 
- It's really verbose;
- Create more classes than needed;
- So, there we are with LazIt, to be not-so-verbose and creating as little classes as possible.


## ROADMAP

- [ ] Create tests
- [ ] Create a way to auto-create utilities based on the user configs
- [ ] Clean the build function, make it better
- [ ] Build tools files/configs
- [ ] Build generics files/configs
- [ ] Build elements files/configs
- [ ] Build objects files/configs
- [ ] Build components files/configs
